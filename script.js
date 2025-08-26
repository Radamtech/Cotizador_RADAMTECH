// --- Cargar precios.json ---
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
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = opcion.precio;
        checkbox.dataset.nombre = opcion.nombre;

        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            seleccion.push(opcion);
          } else {
            seleccion = seleccion.filter(item => item.nombre !== opcion.nombre);
          }
          actualizarResumen();
        });

        let label = document.createElement("label");
        label.textContent = `${opcion.nombre} - $${opcion.precio}`;

        let line = document.createElement("div");
        line.appendChild(checkbox);
        line.appendChild(label);
        subDiv.appendChild(line);
      });

      div.appendChild(subDiv);
    });

    contenedor.appendChild(div);
  });
}

function actualizarResumen() {
  let resumenDiv = document.getElementById("resumen");
  resumenDiv.innerHTML = "<h3>Listado Seleccionado</h3>";
  let ul = document.createElement("ul");

  let subtotal = 0;
  seleccion.forEach(item => {
    subtotal += item.precio;
    let li = document.createElement("li");
    li.textContent = `${item.nombre} - $${item.precio}`;
    ul.appendChild(li);
  });

  resumenDiv.appendChild(ul);

  let descuento = parseInt(document.getElementById("descuento").value) || 0;
  let totalFinal = subtotal - (subtotal * descuento / 100);

  document.getElementById("total").textContent = `TOTAL: $${totalFinal}`;
}

// --- PDF profesional ---
document.getElementById("descargarPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Logo si lo tienes en base64 o url pública
  // doc.addImage("logo.png", "PNG", 10, 10, 30, 30);

  doc.setFontSize(18);
  doc.text("RADAM TECH", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text("Cotización de Servicios Digitales", 105, 28, { align: "center" });

  // Tabla
  let rows = seleccion.map(item => [item.nombre, `$${item.precio}`]);

  let subtotal = seleccion.reduce((acc, item) => acc + item.precio, 0);
  let descuento = parseInt(document.getElementById("descuento").value) || 0;
  let totalFinal = subtotal - (subtotal * descuento / 100);

  rows.push(["", ""]);
  rows.push(["Subtotal", `$${subtotal}`]);
  rows.push([`Descuento (${descuento}%)`, `- $${(subtotal * descuento / 100).toFixed(2)}`]);
  rows.push(["TOTAL", `$${totalFinal}`]);

  doc.autoTable({
    head: [["Concepto", "Precio"]],
    body: rows,
    startY: 40,
  });

  let notas = document.getElementById("notas").value;
  if (notas) {
    doc.text("Notas:", 14, doc.lastAutoTable.finalY + 10);
    doc.text(notas, 14, doc.lastAutoTable.finalY + 16);
  }

  doc.save("cotizacion.pdf");
});

// --- WhatsApp ---
document.getElementById("enviarWhatsApp").addEventListener("click", () => {
  let telefono = document.getElementById("telefono").value;
  if (!telefono) {
    alert("Ingresa un número de WhatsApp");
    return;
  }

  let mensaje = "Cotización RADAM TECH%0A%0A";
  seleccion.forEach(item => {
    mensaje += `${item.nombre} - $${item.precio}%0A`;
  });

  let subtotal = seleccion.reduce((acc, item) => acc + item.precio, 0);
  let descuento = parseInt(document.getElementById("descuento").value) || 0;
  let totalFinal = subtotal - (subtotal * descuento / 100);

  mensaje += `%0ASubtotal: $${subtotal}`;
  mensaje += `%0ADescuento: ${descuento}%`;
  mensaje += `%0ATOTAL: $${totalFinal}`;
  mensaje += `%0ANotas: ${document.getElementById("notas").value}`;

  window.open(`https://wa.me/${telefono}?text=${mensaje}`, "_blank");
});
