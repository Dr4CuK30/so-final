$(document).ready(() => {
  let procesador = new Procesador();
  const classParar = "btn btn-outline-warning";
  const classIniciar = "btn btn-outline-success";
  $("#accionar").click(() => {
    if ($("#accionar").attr("class") == classIniciar) {
      $("#accionar").attr("class", classParar);
      $("#accionar").text("Parar");
      procesador.empezar();
    } else {
      $("#accionar").attr("class", classIniciar);
      $("#accionar").text("Iniciar");
      procesador.detener();
    }
  });

  $("#agregar1").click(() => {
    procesador.agregar(1);
  });

  $("#agregar2").click(() => {
    procesador.agregar(2);
  });

  $("#agregar3").click(() => {
    procesador.agregar(3);
  });
});
