/**
 * Multi-Country Payroll Logic Controller
 * Handles Automated OT, Project-based calculations, and dynamic Tax/Deduction injections.
 */

class PayrollController {
    constructor(dbInstance) {
        this.db = dbInstance;
        // Dynamic Tax configurations for different countries
        this.taxEngine = {
            'US': this._calculateUSTax,
            'UK': this._calculateUKTax,
            'LK': this._calculateLKTax, // Sri Lanka, relevant to MobileMate
            'GLOBAL_DEFAULT': this._calculateFlatTax
        };
    }

    /**
     * Engine: Automated OT & Project-based calculations based on attendance logs.
     * @param {Object} employee 
     * @param {Date} startDate 
     * @param {Date} endDate 
     */
    async calculateEarningsFromAttendance(employee, startDate, endDate) {
        // Fetch Attendance Logs
        const logs = await this.db.attendance
            .where('employee_id').equals(employee.id)
            .filter(l => l.date >= startDate && l.date <= endDate)
            .toArray();

        let totalWorkingHours = 0;
        let totalOTHours = 0;
        let latePenaltyMins = 0;

        logs.forEach(log => {
            if (log.status === 'present' || log.status === 'half-day') {
                totalWorkingHours += log.calculated_hours || 8;
                totalOTHours += log.ot_hours || 0;
                latePenaltyMins += log.late_minutes || 0;
            }
        });

        // Financial Calculation Logic
        const hourlyRate = employee.hourly_rate || (employee.salary / 240); // 240 hrs/month baseline
        const otMultiplier = employee.ot_multiplier || 1.5;

        // Base vs Project-based logic
        let basePay = 0;
        if (employee.employment_type === 'Freelance' || employee.employment_type === 'Project-Based') {
            // Project based is mapped strictly to hours worked, not a fixed monthly salary
            basePay = totalWorkingHours * hourlyRate;
        } else {
            // Permanent gets fixed base salary
            basePay = employee.salary;
        }

        const otPay = totalOTHours * hourlyRate * otMultiplier;
        const latePenalty = (latePenaltyMins / 60) * hourlyRate;

        return {
            basePay,
            otPay,
            latePenalty,
            totalWorkingHours,
            totalOTHours
        };
    }

    /**
     * Engine: Dynamic Tax & Deduction Calculation
     * Runs country-specific formulas against Gross Pay.
     * @param {Number} grossPay 
     * @param {String} countryCode 
     */
    calculateTaxes(grossPay, countryCode) {
        const taxFunction = this.taxEngine[countryCode] || this.taxEngine['GLOBAL_DEFAULT'];
        const taxDeduction = taxFunction(grossPay);

        // Core constraints: Ensure tax doesn't exceed 40% of gross
        return Math.min(taxDeduction, grossPay * 0.40);
    }

    // Dynamic Injection: US Tax Brackets
    _calculateUSTax(grossPay) {
        if (grossPay <= 1100) return 0; // Standard Monthly Deduction Approx
        if (grossPay <= 4000) return (grossPay - 1100) * 0.12;
        return (grossPay * 0.22) - 400; // Simplified simplified formula
    }

    // Dynamic Injection: LK (Sri Lanka) Tax Brackets (PAYE/APIT)
    _calculateLKTax(grossPay) {
        const threshold = 100000;
        if (grossPay <= threshold) return 0;
        let taxable = grossPay - threshold;
        let tax = 0;
        // 6% per 41,666 slab simplified
        if (taxable > 41666) { tax += 41666 * 0.06; taxable -= 41666; } else return tax + (taxable * 0.06);
        if (taxable > 41666) { tax += 41666 * 0.12; taxable -= 41666; } else return tax + (taxable * 0.12);
        if (taxable > 41666) { tax += 41666 * 0.18; taxable -= 41666; } else return tax + (taxable * 0.18);
        return tax + (taxable * 0.24); // Cap bracket
    }

    // Dynamic Injection: Flat generic rate
    _calculateFlatTax(grossPay) {
        return grossPay > 2000 ? grossPay * 0.10 : 0; 
    }

    /**
     * Core Net Pay Processing & Historical Snapshots
     * @param {String} month 
     * @param {Number} year 
     * @param {String} currentCountryCode "US", "LK", etc.
     */
    async processBatchPayroll(month, year, currentCountryCode) {
        const employees = await this.db.employees.where('status').equals('active').toArray();
        const batchId = `BATCH-${year}-${month.toUpperCase()}-${Date.now()}`;
        
        let batchTotalPaid = 0;
        let snapshotData = [];

        // Generate dynamic dates for the month
        const mIdx = new Date(Date.parse(month +" 1, 2012")).getMonth();
        const start = new Date(year, mIdx, 1).toISOString();
        const end = new Date(year, mIdx + 1, 0).toISOString();

        for (let emp of employees) {
            // 1. Calculate Earnings (OT, Late Penalty, Attendance based)
            const attendanceMetrics = await this.calculateEarningsFromAttendance(emp, start, end);
            
            // 2. Fetch Fixed allowances / Leaves
            const leaveDeds = await this._calculateLeaveDeductions(emp, start, end);
            
            const grossPay = attendanceMetrics.basePay + attendanceMetrics.otPay - attendanceMetrics.latePenalty - leaveDeds;
            
            // 3. Tax / Deduction Engine
            const taxAmount = this.calculateTaxes(grossPay, emp.country_code || currentCountryCode);
            
            // 4. Net Processing
            const netSalary = grossPay - taxAmount;

            batchTotalPaid += netSalary;

            // Generate Historical Snapshot map
            const empSnapshot = {
                employee_id: emp.id,
                name: emp.name,
                country: emp.country_code || currentCountryCode,
                gross_salary: grossPay,
                tax_deduction: taxAmount,
                net_salary: netSalary,
                metrics: attendanceMetrics,
                status: 'Processed'
            };

            snapshotData.push(empSnapshot);

            // Directly inject into main Payroll store for localized viewing
            await this.db.payroll.add({
                batch_id: batchId,
                date: new Date().toISOString(),
                employee_id: emp.id,
                month: month,
                year: year,
                basic_salary: attendanceMetrics.basePay,
                ot_pay: attendanceMetrics.otPay,
                late_penalty: attendanceMetrics.latePenalty,
                tax_deduction: taxAmount,
                gross_salary: grossPay,
                net_salary: netSalary,
                status: 'approved'
            });
        }

        // Create Payroll Batch Schema Record
        const batchPkey = await this.db.payroll_batches.add({
            batch_id: batchId,
            country_code: currentCountryCode,
            month: month,
            year: year,
            total_net_payout: batchTotalPaid,
            status: 'Pending_Bank_Transfer',
            processed_date: new Date().toISOString(),
            data_snapshot: snapshotData
        });

        // --- ACCOUNTING INTEGRATION ---
        // Record total payout to General Ledger
        if (typeof recordTransaction === 'function') {
            const accounts = await this.db.accounts.toArray();
            const getAccId = (code) => accounts.find(a => a.code === code)?.id;
            
            const salaryAccId = getAccId('5500'); // Staff Salaries
            const bankAccId = getAccId('1010');   // Bank Account (Default for payroll)

            if (salaryAccId && bankAccId) {
                // Debit Expense (Outflow of value), Credit Asset (Outflow of cash)
                await recordTransaction(salaryAccId, batchTotalPaid, 'debit', `Payroll Payout: ${month} ${year} (${batchId})`, 'Payroll', batchPkey);
                await recordTransaction(bankAccId, batchTotalPaid, 'credit', `Payroll Payout: ${month} ${year} (${batchId})`, 'Payroll', batchPkey);
            }
        }

        return batchId;
    }

    /**
     * Helper for Leave deduction calculation
     */
    async _calculateLeaveDeductions(emp, startDate, endDate) {
        // Find approved leaves that are No-Pay
        const leaves = await this.db.leaves.where('employee_id').equals(emp.id).toArray();
        let unpaidLeaveDays = 0;
        
        leaves.forEach(l => {
            if (l.type === 'No_Pay' && l.status === 'approved') {
                // Simplified overlap check
                if (l.start_date <= endDate && l.end_date >= startDate) {
                    const lS = new Date(Math.max(new Date(l.start_date), new Date(startDate)));
                    const lE = new Date(Math.min(new Date(l.end_date), new Date(endDate)));
                    const days = (lE - lS) / (1000 * 60 * 60 * 24) + 1;
                    unpaidLeaveDays += days;
                }
            }
        });

        const dailyRate = emp.salary / 26; // Approx 26 working days
        return unpaidLeaveDays * dailyRate;
    }
}

// Instance initialization (Assuming 'db' is globally available via Dexie)
// const payrollSystem = new PayrollController(db);
