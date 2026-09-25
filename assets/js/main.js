function showExportModal(){
  const modal=document.createElement("div");
  modal.style.position="fixed";
  modal.style.inset="0";
  modal.style.background="rgba(17,24,39,.75)";
  modal.style.display="grid";
  modal.style.placeItems="center";
  modal.style.zIndex="999";
  modal.innerHTML=`<div style="background:white;max-width:460px;margin:20px;padding:30px;border-radius:24px;text-align:center">
    <h2>Processing locally...</h2>
    <p style="color:#667085;line-height:1.6">Your data stays in your browser. Generated with MangoTools by MangoPie.</p>
    <p style="font-weight:900">Explore automation workflows at mangopie.in</p>
  </div>`;
  document.body.appendChild(modal);
  setTimeout(()=>modal.remove(),3000);
}
