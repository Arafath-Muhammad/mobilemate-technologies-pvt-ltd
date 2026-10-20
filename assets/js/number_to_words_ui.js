/**
 * number_to_words_ui.js
 * Lightweight UI glue for the Amount To Words view.
 */
(function(){
    'use strict';

    function formatAndShow(amount){
        const out = document.getElementById('amount-to-words-output');
        if(!out) return;
        const text = window.NumberToWords ? window.NumberToWords.amountToChequeWords(amount) : '';
        out.textContent = text || '';
    }

    function copyOutput(){
        const out = document.getElementById('amount-to-words-output');
        if(!out) return;
        const txt = out.textContent || '';
        if(!txt) return;
        navigator.clipboard?.writeText(txt).then(()=>{
            if(window.Toastify){
                // optional: use existing toast library if present
            }
        }).catch(()=>{});
    }

    function init(){
        const input = document.getElementById('amount-to-words-input');
        const btn = document.getElementById('amount-to-words-convert');
        const copy = document.getElementById('amount-to-words-copy');
        if(!input || !btn) return;

        btn.addEventListener('click', ()=> formatAndShow(input.value));
        input.addEventListener('keyup', (e)=>{ if(e.key === 'Enter') formatAndShow(input.value); });
        copy?.addEventListener('click', copyOutput);

        // When nav button for this view is clicked, render current input (debounced briefly
        // so the framework can toggle classes first). This avoids observing the whole DOM
        // which could cause recursive mutations when we update output text.
        const navBtn = document.querySelector('.nav-btn[data-target="number-words-view"]');
        if(navBtn){
            navBtn.addEventListener('click', ()=>{
                setTimeout(()=>{ if(input.value) formatAndShow(input.value); }, 50);
            });
        }
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
