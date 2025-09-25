let precios = {};
let seleccion = [];

fetch("precios.json")
  .then(res => res.json())
  .then(data => {
    precios = data;
    generarCategorias();
  });

function generarCategorias() {
  const contenedor = document.getElementById("categorias");
  contenedor.innerHTML = "";

  Object.keys(precios).forEach(categoria => {
    let div = document.createElement("div");
    div.classList.add("categoria");
    div.innerHTML = `<h3>${categoria}</h3>`;

    Object.keys(precios[categoria]).forEach(sub => {
      let subDiv = document.createElement("div");
      subDiv.innerHTML = `<h4>${sub}</h4>`;

      precios[categoria][sub].forEach(opcion => {
        if(opcion.multiplicable){
          let input = document.createElement("input");
          input.type = "number";
          input.min = 1;
          input.value = 1;
          input.dataset.nombre = opcion.nombre;
          input.dataset.precio = opcion.precio;

          input.addEventListener("input", e => {
            let idx = seleccion.findIndex(item => item.nombre === opcion.nombre);
            let cantidad = parseInt(e.target.value) || 0;
            let precioTotal = cantidad * opcion.precio;

            if(idx !== -1){
              seleccion[idx].cantidad = cantidad;
              seleccion[idx].precioTotal = precioTotal;
            } else {
              seleccion.push({nombre: opcion.nombre, precio: opcion.precio, cantidad, precioTotal});
            }
            actualizarResumen();
          });

          let label = document.createElement("label");
          label.textContent = `${opcion.nombre} x`;
          let line = document.createElement("div");
          line.classList.add("linea");
          line.appendChild(label);
          line.appendChild(input);
          subDiv.appendChild(line);

        } else {
          let checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.dataset.nombre = opcion.nombre;
          checkbox.dataset.precio = opcion.precio;

          checkbox.addEventListener("change", e => {
            if(e.target.checked){
              seleccion.push({nombre: opcion.nombre, precio: opcion.precio});
            } else {
              seleccion = seleccion.filter(item => item.nombre !== opcion.nombre);
            }
            actualizarResumen();
          });

          let label = document.createElement("label");
          label.textContent = `${opcion.nombre} - $${opcion.precio}`;
          let line = document.createElement("div");
          line.classList.add("linea");
          line.appendChild(checkbox);
          line.appendChild(label);
          subDiv.appendChild(line);
        }
      });

      div.appendChild(subDiv);
    });

    contenedor.appendChild(div);
  });
}

function actualizarResumen(){
  const resumenDiv = document.getElementById("resumen");
  resumenDiv.innerHTML = "";

  let subtotal = 0;
  seleccion.forEach(item => {
    let precioItem = item.precioTotal || item.precio;
    subtotal += precioItem;

    let card = document.createElement("div");
    card.classList.add("item");
    let cantidadText = item.cantidad ? ` x${item.cantidad}` : "";
    card.innerHTML = `<span class="name">${item.nombre}${cantidadText}</span><span class="price">$${precioItem}</span>`;
    resumenDiv.appendChild(card);
  });

  let descuento = parseInt(document.getElementById("descuento").value) || 0;
  let totalFinal = subtotal - (subtotal*descuento/100);
  document.getElementById("total").textContent = `$${totalFinal}`;
}

document.getElementById("descargarPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // === Logo ===
  let img = new Image();
  img.src = "logo.png";
  img.onload = function() {
    doc.addImage(img, "PNG", 15, 10, 25, 25); // x, y, ancho, alto

    // === Encabezado ===
    doc.setFontSize(18);
    doc.text("RADAM TECH", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Cotización de Servicios Digitales", 105, 28, { align: "center" });

    // === Fecha ===
    let hoy = new Date();
    let fechaStr = hoy.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    doc.setFontSize(10);
    doc.text(`Fecha: ${fechaStr}`, 200, 15, { align: "right" });

    // === Categoría ===
    let categoria = document.getElementById("categoria").value || "No especificada";
    doc.text(`Categoría: ${categoria}`, 200, 22, { align: "right" });

    // === Tabla ===
    let rows = seleccion.map(item => {
      let precioItem = item.precioTotal || item.precio;
      let cantidad = item.cantidad || 1; // por defecto 1
      return [item.nombre, cantidad, `$${precioItem}`];
    });

    let subtotal = seleccion.reduce((acc,item)=>acc + (item.precioTotal||item.precio),0);
    let descuento = parseInt(document.getElementById("descuento").value) || 0;
    let totalFinal = subtotal - (subtotal*descuento/100);

    rows.push(["", "", ""]);
    rows.push(["Subtotal","", `$${subtotal}`]);
    rows.push([`Descuento (${descuento}%)`,"", `- $${(subtotal*descuento/100).toFixed(2)}`]);
    rows.push(["TOTAL","", `$${totalFinal}`]);

    doc.autoTable({
      head: [["Concepto","Cant.","Precio"]],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [42,134,255], textColor: 255, halign: "center" },
      bodyStyles: { fillColor: [5,20,35], textColor: 255, halign: "center" },
      styles: { lineColor: [255,255,255], lineWidth: 0.25 },
      didParseCell: function (data) {
        if (data.row.index === rows.length - 1) { // resaltar TOTAL
          data.cell.styles.fillColor = [42,134,255];
          data.cell.styles.fontStyle = "bold";
        }
      }
    });

    // === Notas ===
    let notas = document.getElementById("notas").value;
    if(notas){
      doc.text("Notas:", 14, doc.lastAutoTable.finalY + 10);
      doc.text(notas, 14, doc.lastAutoTable.finalY + 16);
    }

    doc.save("cotizacion.pdf");
  };
});

document.getElementById("enviarWhatsApp").addEventListener("click", ()=>{
  let telefono = document.getElementById("telefono").value;
  if(!telefono){ alert("Ingresa un número de WhatsApp"); return; }

  let mensaje = "Cotización RADAM TECH%0A%0A";
  seleccion.forEach(item=>{
    let cantidad = item.cantidad ? ` x${item.cantidad}` : "";
    let precioItem = item.precioTotal || item.precio;
    mensaje += `${item.nombre}${cantidad} - $${precioItem}%0A`;
  });

  let subtotal = seleccion.reduce((acc,item)=>acc + (item.precioTotal||item.precio),0);
  let descuento = parseInt(document.getElementById("descuento").value) || 0;
  let totalFinal = subtotal - (subtotal*descuento/100);

  mensaje += `%0ASubtotal: $${subtotal}`;
  mensaje += `%0ADescuento: ${descuento}%`;
  mensaje += `%0ATOTAL: $${totalFinal}`;
  mensaje += `%0ANotas: ${document.getElementById("notas").value}`;

  window.open(`https://wa.me/${telefono}?text=${mensaje}`,"_blank");
});
