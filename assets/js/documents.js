/**
 * Custom Documents & Letterhead Generator
 * Allows users to type content and generate a PDF with the company letterhead.
 */

async function loadDocuments() {
    const container = document.getElementById('documents-view');
    if (!container) return;

    // Premium UI for the Document Generator
    container.innerHTML = `
        <div class="flex flex-col gap-6 animate-fade-in">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder">
                <div>
                    <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight italic">Custom Document Creator</h2>
                    <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Design & Export Professional Letterheads</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="clearDocument()" class="px-6 py-2.5 rounded-xl border-2 border-gray-100 dark:border-darkBorder text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold text-sm flex items-center gap-2">
                        <i class="fa-solid fa-trash-can"></i> Clear
                    </button>
                    <button onclick="previewLetterhead()" class="px-6 py-2.5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-all font-bold text-sm flex items-center gap-2">
                        <i class="fa-solid fa-eye"></i> Live Preview
                    </button>
                    <button onclick="generateLetterheadPDF()" class="px-8 py-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all font-black text-sm flex items-center gap-2">
                        <i class="fa-solid fa-file-pdf"></i> Generate PDF
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <!-- Editor Sidebar / Controls -->
                <div class="xl:col-span-1 space-y-6">
                    <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder">
                        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Editor Toolbar</h3>
                        <div class="grid grid-cols-3 gap-2">
                            <button onclick="execDocCommand('bold')" class="editor-tool-btn" title="Bold"><i class="fa-solid fa-bold"></i></button>
                            <button onclick="execDocCommand('italic')" class="editor-tool-btn" title="Italic"><i class="fa-solid fa-italic"></i></button>
                            <button onclick="execDocCommand('underline')" class="editor-tool-btn" title="Underline"><i class="fa-solid fa-underline"></i></button>
                            <button onclick="execDocCommand('justifyLeft')" class="editor-tool-btn" title="Align Left"><i class="fa-solid fa-align-left"></i></button>
                            <button onclick="execDocCommand('justifyCenter')" class="editor-tool-btn" title="Align Center"><i class="fa-solid fa-align-center"></i></button>
                            <button onclick="execDocCommand('justifyRight')" class="editor-tool-btn" title="Align Right"><i class="fa-solid fa-align-right"></i></button>
                            <button onclick="execDocCommand('insertUnorderedList')" class="editor-tool-btn" title="Bullet List"><i class="fa-solid fa-list-ul"></i></button>
                            <button onclick="execDocCommand('insertOrderedList')" class="editor-tool-btn" title="Numbered List"><i class="fa-solid fa-list-ol"></i></button>
                            <button onclick="execDocCommand('outdent')" class="editor-tool-btn" title="Outdent"><i class="fa-solid fa-outdent"></i></button>
                        </div>
                        
                        <div class="mt-6 border-t border-gray-100 dark:border-darkBorder pt-6">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Subject / Title</label>
                            <input type="text" id="doc-subject" class="w-full px-4 py-3 bg-gray-50 dark:bg-darkBorder rounded-xl text-sm font-bold border-2 border-transparent focus:border-primary/30 outline-none transition-all" placeholder="Enter document title...">
                        </div>

                        <div class="mt-4">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Reference Number</label>
                            <input type="text" id="doc-ref" class="w-full px-4 py-3 bg-gray-50 dark:bg-darkBorder rounded-xl text-sm font-bold border-2 border-transparent focus:border-primary/30 outline-none transition-all" placeholder="e.g. MM/QT/2026/01">
                        </div>
                    </div>

                    <div class="bg-primary p-6 rounded-3xl shadow-xl shadow-primary/20 text-white relative overflow-hidden group">
                        <i class="fa-solid fa-lightbulb absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-500"></i>
                        <h4 class="text-lg font-black italic tracking-tight mb-2">Pro Tip</h4>
                        <p class="text-xs text-white/80 leading-relaxed font-medium">Use the editor on the right to draft your content. The generated PDF will automatically include the official MobileMate letterhead and watermark.</p>
                    </div>
                </div>

                <!-- Main Editor Area (Simulated Page) -->
                <div class="xl:col-span-3">
                    <div class="bg-gray-100 dark:bg-gray-800/50 p-6 md:p-12 rounded-[2.5rem] flex justify-center shadow-inner border border-gray-200 dark:border-darkBorder overflow-hidden">
                        <div id="document-editor" contenteditable="true" 
                             class="w-[210mm] min-h-[297mm] bg-white text-gray-800 p-[20mm] shadow-2xl focus:outline-none relative prose prose-slate max-w-none text-lg leading-relaxed"
                             placeholder="Start typing your official correspondence here...">
                            <p>To,</p>
                            <p><b>[Recipient Name]</b><br>[Recipient Address]</p>
                            <p><br></p>
                            <p><b>Sub: [Enter Subject Here]</b></p>
                            <p><br></p>
                            <p>Dear Sir/Madam,</p>
                            <p><br></p>
                            <p>Write your content here...</p>
                            <p><br></p>
                            <p><br></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .editor-tool-btn {
                @apply w-full aspect-square flex items-center justify-center rounded-xl bg-gray-50 dark:bg-darkBorder text-gray-500 hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90;
            }
            #document-editor[placeholder]:empty:before {
                content: attr(placeholder);
                @apply text-gray-300 pointer-events-none;
            }
            .prose b, .prose strong { @apply font-bold text-gray-900; }
        </style>
    `;

    initDocEditor();
}

function initDocEditor() {
    const editor = document.getElementById('document-editor');
    if (!editor) return;

    // Persist content to local storage
    editor.addEventListener('input', () => {
        localStorage.setItem('cached_custom_doc_content', editor.innerHTML);
    });

    const cached = localStorage.getItem('cached_custom_doc_content');
    if (cached) {
        editor.innerHTML = cached;
    }
}

function execDocCommand(command, value = null) {
    document.execCommand(command, false, value);
    const editor = document.getElementById('document-editor');
    if (editor) editor.focus();
}

function clearDocument() {
    Swal.fire({
        title: 'Clear Document?',
        text: 'This will erase all content in the editor.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, clear it'
    }).then((result) => {
        if (result.isConfirmed) {
            const editor = document.getElementById('document-editor');
            if (editor) {
                editor.innerHTML = '<p><br></p>';
                localStorage.removeItem('cached_custom_doc_content');
            }
        }
    });
}

async function previewLetterhead() {
    try {
        const editor = document.getElementById('document-editor');
        if (!editor) return;
        const content = editor.innerHTML;
        
        // Fetch info from settings
        let logoSrc = 'assets/icons/favicon.png';
        let storeName = 'MOBILEMATE';
        let storeSubheading = 'YOUR TRUSTED TECH GADGETS PROVIDER';
        let storeEmail = 'info@mobilemate.lk';
        let storePhone = '+9477 516 5589';
        let storeWebsite = 'www.mobilemate.lk';
        let storeAddress = 'N/A';
        
        const logoSet = await db.settings.get('store_logo');
        if (logoSet && logoSet.value) logoSrc = logoSet.value;
        
        const nameSet = await db.settings.get('store_name');
        if (nameSet && nameSet.value) storeName = nameSet.value;

        const subSet = await db.settings.get('store_subheading');
        if (subSet && subSet.value) storeSubheading = subSet.value;

        const enabledSubSet = await db.settings.get('enabled_store_subheading');
        const enabledStoreSubheading = enabledSubSet ? enabledSubSet.value !== false : true;

        const emailSet = await db.settings.get('store_email');
        if (emailSet && emailSet.value) storeEmail = emailSet.value;

        const phoneSet = await db.settings.get('store_phone');
        if (phoneSet && phoneSet.value) storePhone = phoneSet.value;

        const webSet = await db.settings.get('store_website');
        if (webSet && webSet.value) storeWebsite = webSet.value;

        const addrSet = await db.settings.get('store_address');
        if (addrSet && addrSet.value) storeAddress = addrSet.value;

        const enabledAddrSet = await db.settings.get('enabled_store_address');
        const enabledStoreAddress = enabledAddrSet ? enabledAddrSet.value !== false : true;

        const tinSet = await db.settings.get('tax_tin');
        const brSet = await db.settings.get('store_br');
        let storeTin = (tinSet && tinSet.value) ? tinSet.value : '';
        let storeBr = (brSet && brSet.value) ? brSet.value : '';

        const finalHtml = getLetterheadTemplate(content, logoSrc, storeName, storeSubheading, storeEmail, storePhone, storeWebsite, storeAddress, storeTin, storeBr, enabledStoreAddress, enabledStoreSubheading);
    
        const subject = document.getElementById('doc-subject')?.value || 'Custom_Document';
        const filename = subject.replace(/[^a-z0-9]/gi, '_') + '.pdf';

        // Use the global openPreviewModal from app.js
        if (typeof openPreviewModal === 'function') {
            openPreviewModal(
                finalHtml, 
                () => {
                    const iframe = document.getElementById('preview-iframe');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.print();
                    }
                },
                null,
                null,
                () => {
                    if (typeof generatePDFAndShare === 'function') {
                        generatePDFAndShare(finalHtml, filename);
                    }
                },
                () => generateLetterheadPDF()
            );
        } else {
            const win = window.open('', '_blank');
            win.document.write(finalHtml);
            win.document.close();
        }
    } catch (err) {
        console.error("Preview Error:", err);
        showAlert('Error', 'Failed to generate preview.', 'error');
    }
}

async function generateLetterheadPDF() {
    try {
        const editor = document.getElementById('document-editor');
        if (!editor) return;

        const content = editor.innerHTML;
        const subject = document.getElementById('doc-subject')?.value || 'Custom_Document';
        const filename = subject.replace(/[^a-z0-9]/gi, '_') + '.pdf';

        // Fetch info from settings
        let logoSrc = 'assets/icons/favicon.png';
        let storeName = 'MOBILEMATE';
        let storeSubheading = 'YOUR TRUSTED TECH GADGETS PROVIDER';
        let storeEmail = 'info@mobilemate.lk';
        let storePhone = '+9477 516 5589';
        let storeWebsite = 'www.mobilemate.lk';
        let storeAddress = 'N/A';
        
        const logoSet = await db.settings.get('store_logo');
        if (logoSet && logoSet.value) logoSrc = logoSet.value;
        
        const nameSet = await db.settings.get('store_name');
        if (nameSet && nameSet.value) storeName = nameSet.value;

        const subSet = await db.settings.get('store_subheading');
        if (subSet && subSet.value) storeSubheading = subSet.value;

        const enabledSubSet = await db.settings.get('enabled_store_subheading');
        const enabledStoreSubheading = enabledSubSet ? enabledSubSet.value !== false : true;

        const emailSet = await db.settings.get('store_email');
        if (emailSet && emailSet.value) storeEmail = emailSet.value;

        const phoneSet = await db.settings.get('store_phone');
        if (phoneSet && phoneSet.value) storePhone = phoneSet.value;

        const webSet = await db.settings.get('store_website');
        if (webSet && webSet.value) storeWebsite = webSet.value;

        const addrSet = await db.settings.get('store_address');
        if (addrSet && addrSet.value) storeAddress = addrSet.value;

        const enabledAddrSet = await db.settings.get('enabled_store_address');
        const enabledStoreAddress = enabledAddrSet ? enabledAddrSet.value !== false : true;

        const tinSet = await db.settings.get('tax_tin');
        const brSet = await db.settings.get('store_br');
        let storeTin = (tinSet && tinSet.value) ? tinSet.value : '';
        let storeBr = (brSet && brSet.value) ? brSet.value : '';

        const finalHtml = getLetterheadTemplate(content, logoSrc, storeName, storeSubheading, storeEmail, storePhone, storeWebsite, storeAddress, storeTin, storeBr, enabledStoreAddress, enabledStoreSubheading);
    
        showAlert('Generating...', 'Your document is being prepared...', 'info');

        // Use the global generatePDFAndShare from app.js
        if (typeof generatePDFAndShare === 'function') {
            await generatePDFAndShare(finalHtml, filename, { forceDownload: true });
        } else {
            // Fallback if not found
            const opt = {
                margin: [0, 0, 0, 0],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(finalHtml).save();
        }
    } catch (err) {
        console.error("PDF Generation Error:", err);
        showAlert('Error', 'Failed to generate PDF.', 'error');
    }
}

function getLetterheadTemplate(content, logoSrc, storeName, storeSubheading, storeEmail, storePhone, storeWebsite, storeAddress, storeTin = '', storeBr = '', enabledStoreAddress = true, enabledStoreSubheading = true) {
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const ref = document.getElementById('doc-ref')?.value || 'N/A';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                
                body {
                    margin: 0;
                    padding: 0;
                }
                
                .page {
                    font-family: 'Outfit', sans-serif;
                    color: #1a1a1a;
                    width: 210mm;
                    min-height: 296.5mm;
                    background: white;
                    display: flex;
                    flex-direction: column;
                    padding: 15mm 20mm 15mm 20mm;
                    box-sizing: border-box;
                }

                /* Header Design matching Sales Invoice */
                .header {
                    margin-bottom: 20px;
                }

                .brand-title {
                    color: #01a5a5;
                    font-size: 20px;
                    font-weight: 900;
                    margin: 0;
                    text-transform: uppercase;
                    line-height: 1.1;
                    letter-spacing: 1px;
                }

                .brand-subheading {
                    color: #374151;
                    font-size: 15px;
                    font-weight: 800;
                    margin: 5px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .brand-address {
                    color: #4b5563;
                    font-size: 13px;
                    font-weight: 500;
                    margin: 4px 0;
                }

                .brand-contact {
                    color: #4b5563;
                    font-size: 12px;
                    font-weight: 600;
                    margin-top: 5px;
                }

                .brand-tax-info {
                    color: #0e3257;
                    font-size: 11px;
                    font-weight: 800;
                    margin-top: 5px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .brand-contact span, .brand-tax-info span {
                    margin: 0 5px;
                    color: #9ca3af;
                }

                .header-logo {
                    max-height: 70px;
                    max-width: 120px;
                    object-fit: contain;
                }

                /* Watermark */
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 150mm;
                    opacity: 0.04;
                    z-index: 0;
                    pointer-events: none;
                }

                /* Content Area */
                .content {
                    margin-top: 20px;
                    position: relative;
                    z-index: 5;
                    flex: 1;
                }

                .meta-table {
                    width: 100%;
                    margin-bottom: 15mm;
                    font-size: 14px;
                    font-weight: 700;
                    color: #111827;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 8px;
                }

                .body-text {
                    font-size: 16px;
                    line-height: 1.7;
                    color: #1f2937;
                }

                /* Footer */
                .footer {
                    margin-top: auto;
                    background: linear-gradient(135deg, #0e3257 0%, #01a5a5 100%);
                    padding: 10px 20mm;
                    box-sizing: border-box;
                }

                .footer-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: rgba(255,255,255,0.95);
                    gap: 12px;
                }

                .footer-col {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .footer-col-center {
                    text-align: center;
                    flex: 1;
                }

                .footer-label {
                    font-size: 7px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: rgba(255,255,255,0.6);
                }

                .footer-value {
                    font-size: 9px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.95);
                }

                .footer-brand {
                    font-size: 11px;
                    font-weight: 900;
                    color: #ffffff;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .footer-tagline {
                    font-size: 7.5px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.7);
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    margin-top: 1px;
                }

                .footer-divider {
                    width: 1px;
                    height: 30px;
                    background: rgba(255,255,255,0.25);
                    flex-shrink: 0;
                }

                .footer-confidential {
                    margin-top: 5px;
                    border-top: 1px solid rgba(255,255,255,0.15);
                    padding-top: 4px;
                    text-align: center;
                    font-size: 7px;
                    color: rgba(255,255,255,0.5);
                    letter-spacing: 0.5px;
                }

                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .page { box-shadow: none !important; margin: 0 !important; }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <!-- Watermark -->
                <img src="${logoSrc}" class="watermark">

                <!-- Header -->
                <header class="header">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h1 class="brand-title">${storeName}</h1>
                            ${enabledStoreSubheading && storeSubheading ? `<div class="brand-subheading">${storeSubheading}</div>` : ''}
                            ${enabledStoreAddress && storeAddress ? `<div class="brand-address">${storeAddress.split('\n').join(' | ')}</div>` : ''}
                            <div class="brand-tax-info">
                                ${storeTin ? `TIN: ${storeTin}` : ''} 
                                ${storeTin && storeBr ? '<span>|</span>' : ''} 
                                ${storeBr ? `BR: ${storeBr}` : ''}
                            </div>
                        </div>
                        ${logoSrc && !logoSrc.includes('favicon') ? `<img src="${logoSrc}" class="header-logo">` : ''}
                    </div>
                </header>

                <hr style="border: 0; border-top: 2px solid #01a5a5; margin: 15px 0;">

                <!-- Document Content -->
                <main class="content">
                    <table class="meta-table">
                        <tr>
                            <td align="left">Ref: ${ref}</td>
                            <td align="right">Date: ${date}</td>
                        </tr>
                    </table>
                    
                    <div class="body-text">
                        ${content}
                    </div>
                </main>

                <!-- Footer -->
                <footer class="footer">
                    <div class="footer-bar">
                        <!-- Left: Contact Info -->
                        <div class="footer-col">
                            <div class="footer-label">Phone</div>
                            <div class="footer-value">${storePhone}</div>
                            <div class="footer-label" style="margin-top:3px;">Email</div>
                            <div class="footer-value">${storeEmail}</div>
                        </div>

                        <div class="footer-divider"></div>

                        <!-- Center: Brand -->
                        <div class="footer-col footer-col-center">
                            <div class="footer-brand">${storeName}</div>
                            <div class="footer-tagline">${storeSubheading}</div>
                        </div>

                        <div class="footer-divider"></div>

                        <!-- Right: Address & Web -->
                        <div class="footer-col" style="text-align:right;">
                            <div class="footer-label">Website</div>
                            <div class="footer-value">${storeWebsite}</div>
                            ${enabledStoreAddress ? `
                            <div class="footer-label" style="margin-top:3px;">Address</div>
                            <div class="footer-value">${storeAddress.split('\n')[0]}</div>` : ''}
                        </div>
                    </div>
                    <div class="footer-confidential">
                        This document is confidential and intended solely for the use of the addressed recipient. &nbsp;|&nbsp; Powered by <strong>Infinity Creative Works</strong>
                    </div>
                </footer>
            </div>
        </body>
        </html>
    `;
}
