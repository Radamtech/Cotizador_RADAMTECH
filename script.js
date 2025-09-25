document.getElementById("descargarPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // === Datos generales ===
  const rfc = "AAMR061214HOCNJDA7";
  const cliente = document.getElementById("cliente")?.value || "No especificado";
  const formaPago = document.getElementById("formaPago")?.value || "No especificada";
  const vigencia = "Esta cotización es válida por 15 días hábiles";
  const notas = document.getElementById("notas")?.value || "";
  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
  const categoria = document.querySelector('input[name="categoria"]:checked')?.value || "No especificada";
  const numCotizacion = `COT-${rfc}-${hoy.getFullYear()}${(hoy.getMonth()+1).toString().padStart(2,"0")}${hoy.getDate().toString().padStart(2,"0")}`;

  // === Totales ===
  let subtotal = seleccion.reduce((acc,item)=>acc + (item.precioTotal||item.precio),0);
  let descuento = parseInt(document.getElementById("descuento")?.value) || 0;
  let subtotalConDescuento = subtotal - (subtotal*descuento/100);
  let iva = subtotalConDescuento * 0.16;
  let totalFinal = subtotalConDescuento + iva;

  // === Tabla de productos ===
  let rows = seleccion.map(item => {
    let precioItem = item.precioTotal || item.precio;
    let cantidad = item.cantidad || 1;
    return [item.nombre, cantidad, `$${precioItem.toFixed(2)}`];
  });

  // === Función de encabezado y footer ===
  const drawHeaderFooter = (doc) => {
    // Encabezado azul
    doc.setFillColor(42,134,255);
    doc.rect(0, 0, 210, 40, "F");

    let img = new Image();
    img.src = "logo.png";
    doc.addImage(img, "PNG", 15, 5, 30, 30);

    doc.setFontSize(18);
    doc.setFont("helvetica","bold");
    doc.setTextColor(255,255,255);
    doc.text("RADAM TECH", 105, 18, { align:"center" });

    doc.setFontSize(12);
    doc.setFont("helvetica","normal");
    doc.text("Cotización de Servicios Digitales", 105, 28, { align:"center" });

    doc.setFontSize(10);
    doc.text(`Fecha: ${fechaStr}`, 200, 10, { align:"right" });
    doc.text(`Categoría: ${categoria}`, 200, 16, { align:"right" });
    doc.text(`No. Cotización: ${numCotizacion}`, 200, 22, { align:"right" });

    // Footer azul
    const footerY = 290;
    doc.setFillColor(42,134,255);
    doc.rect(0, footerY-5, 210, 15, "F");
    doc.setFontSize(10);
    doc.setTextColor(255,255,255);
    doc.setFont("helvetica","normal");
    doc.text("RADAM TECH - Contacto: Rodolfo Alexis / Daniela Valentina - Tel: 722 612 8347 - www.radamtech.com", 105, footerY+5, { align:"center" });
  };

  // Dibujar encabezado y footer en primera página
  drawHeaderFooter(doc);

  // === Tabla de productos multi-página ===
  doc.autoTable({
    head: [["Concepto","Cantidad","Precio"]],
    body: rows,
    startY: 45,
    theme: "grid",
    headStyles: { fillColor: [42,134,255], textColor: 255, fontStyle:"bold", halign:"center" },
    bodyStyles: { fontSize:10, textColor:50, halign:"center" },
    alternateRowStyles: { fillColor: [245,250,255] },
    styles: { lineColor:[200,200,200], lineWidth:0.3 },
    margin: { top: 45, bottom: 35 },
    didDrawPage: function(data){
      if(data.pageNumber > 1) drawHeaderFooter(doc);
    }
  });

  // === Totales separados ===
  const yTotales = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica","bold");
  doc.setTextColor(42,134,255);
  doc.text("Resumen de Totales", 14, yTotales);

  doc.autoTable({
    startY: yTotales + 4,
    theme: "grid",
    body: [
      ["Subtotal", `$${subtotal.toFixed(2)}`],
      [`Descuento (${descuento}%)`, `- $${(subtotal*descuento/100).toFixed(2)}`],
      ["Subtotal con Descuento", `$${subtotalConDescuento.toFixed(2)}`],
      ["IVA 16%", `$${iva.toFixed(2)}`],
      ["TOTAL", `$${totalFinal.toFixed(2)}`]
    ],
    head: [],
    bodyStyles: { textColor:50, fontSize:10, halign:"right" },
    styles: { fillColor:[245,250,255], lineColor:[200,200,200], lineWidth:0.3 },
    columnStyles: { 0:{halign:"left"}, 1:{halign:"right"} }
  });

  // === Datos legales y notas finales ===
  const yDatos = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica","bold");
  doc.setTextColor(42,134,255);
  doc.text("Datos de Cotización:", 14, yDatos);

  doc.setFont("helvetica","normal");
  doc.setTextColor(50);
  doc.text(`RFC: ${rfc}`, 14, yDatos + 6);
  doc.text(`Cliente: ${cliente}`, 14, yDatos + 12);
  doc.text(`Forma de pago: ${formaPago}`, 14, yDatos + 18);
  doc.text(vigencia, 14, yDatos + 24);

  if(notas){
    doc.setFont("helvetica","bold");
    doc.setTextColor(42,134,255);
    doc.text("Notas:", 14, yDatos + 34);

    doc.setFont("helvetica","normal");
    doc.setTextColor(50);
    doc.text(notas, 14, yDatos + 40);
  }

  // === Guardar PDF ===
  doc.save(`cotizacion_${numCotizacion}.pdf`);
});
