function Procesador() {
  this.valor_envejecimiento = 6;

  this.quantum = 4;
  this.probabilidad_bloqueo = 10;
  this.timer = 0;
  this.hilo_timer;
  this.hilo_verificador;
  this.proceso_actual = null;
  this.sus_por_prioridad = false;

  // Colas
  this.fcfs = new Cola(); // First Come First Served
  this.sjf = new Cola(true); // Short Job First
  this.rr = new Cola(); // Round Robin
  this.bloq = new Cola(); // Bloqueados
  this.listos = new Cola(); // Listos
  this.term = new Cola(); // Terminados
  this.general = new Cola(); // Total con todos los procesos

  // Tabla envejecimiento
  this.envejecimiento = [];

  this.empezar = () => {
    this.hilo_timer = setInterval(() => {
      if (this.proceso_actual == null) {
        if (!this.rr.estaVacia()) {
          this.proceso_actual = this.rr.atender().obj;
          this.proceso_actual.estado = EJECUCION;
        } else if (!this.sjf.estaVacia()) {
          this.proceso_actual = this.sjf.atender().obj;
          this.proceso_actual.estado = EJECUCION;
        } else if (!this.fcfs.estaVacia()) {
          this.proceso_actual = this.fcfs.atender().obj;
          this.proceso_actual.estado = EJECUCION;
        }
      }

      lista = this.general.enlistar();
      lista.forEach((nodo, indice, array) => {
        proceso = nodo.obj;
        if (proceso.estado == ESPERA) {
          proceso.fila.push(0);
        } else if (proceso.estado == EJECUCION) {
          proceso.fila.push(1);
          cadena = "<td>" + proceso.nombre + "</td>";
          cadena += "<td>" + proceso.rafaga_res + "</td>";
          $("#proceso-actual").html(cadena);
          $("#semaforo").attr("class", "rojo");
          if (proceso.rafaga_res > 0) {
            let se_suspendio = false;
            proceso.rafaga_res--;
            if (proceso.prioridad == 1) {
              if (proceso.rafaga - proceso.rafaga_res == this.quantum + 1) {
                this.suspender_actual(proceso);
                se_suspendio = true;
              }
            }
            if (!se_suspendio) {
              const random =
                Math.floor(Math.random() * this.probabilidad_bloqueo) + 1;
              if (random === 10) {
                this.bloquear_actual();
              }
            }
          } else {
            proceso.estado = TERMINADO;
            this.term.ingresar(proceso);
            this.proceso_actual = null;
            $("#proceso-actual").html("");
            $("#semaforo").attr("class", "verde");
          }
        } else if (proceso.estado == BLOQUEO) {
          if (proceso.bloqueo > 0) {
            proceso.fila.push(2);
            proceso.bloqueo--;
          } else {
            proceso.bloqueo--;
            if (proceso.bloqueo == -1) {
              proceso.fila.push(2);
              this.bloq.atender();
              switch (proceso.prioridad) {
                case 1:
                  this.rr.ingresar(
                    new Proceso(
                      this.timer + 1,
                      proceso.prioridad,
                      proceso.rafaga_res + 1,
                      proceso.nombre
                    )
                  );
                  break;
                case 2:
                  this.sjf.ingresar(
                    new Proceso(
                      this.timer + 1,
                      proceso.prioridad,
                      proceso.rafaga_res + 1,
                      proceso.nombre
                    )
                  );
                  break;
                case 3:
                  this.fcfs.ingresar(
                    new Proceso(
                      this.timer + 1,
                      proceso.prioridad,
                      proceso.rafaga_res + 1,
                      proceso.nombre
                    )
                  );
                  break;
              }
            }
            proceso.bloqueo = -2;
          }
        } else if (proceso.estado == SUSPENDIDO) {
          if (proceso.suspendido > 0) {
            proceso.fila.push(3);
            proceso.suspendido--;
          }
        }
      });
      this.analizar_envejecimiento();
      this.actualizar_envejecimiento();
      this.actualizar_cola("rr");
      this.actualizar_cola("sjf");
      this.actualizar_cola("fcfs");
      this.actualizar_cola("bloqueo");
      this.actualizar_cola("terminado");
      this.actualizar_general();
      this.obtener_tabla_general();
      this.obtener_gantt();

      this.timer++;
      $("#timer").html(this.timer);
    }, 1000);

    this.hilo_verificador = setInterval(this.verificar_prioridad, 1000);
  };

  this.detener = () => {
    clearInterval(this.hilo_timer);
    clearInterval(this.hilo_verificador);
  };

  this.agregar = (pri = Math.floor(Math.random() * 3) + 1) => {
    // Generar prioridad aleatoria
    prioridad = pri;

    proceso = new Proceso(this.timer, prioridad);
    switch (prioridad) {
      case 1:
        this.rr.ingresar(proceso);
        break;
      case 2:
        this.sjf.ingresar(proceso);
        if (this.proceso_actual != null) {
          if (proceso.rafaga < this.proceso_actual.rafaga_res) {
            this.suspender_actual(this.proceso_actual);
          }
        }
        break;
      case 3:
        this.fcfs.ingresar(proceso);
        break;
      default:
        console.error("prioridad no valida. No existe la lista.");
        break;
    }
    this.actualizar_cola("rr");
    this.actualizar_cola("sjf");
    this.actualizar_cola("fcfs");
    this.actualizar_general();
    this.obtener_tabla_inicial();
  };

  this.bloquear_actual = () => {
    this.proceso_actual.bloquear();
    this.bloq.ingresar(this.proceso_actual);
    this.term.ingresar(this.proceso_actual);
    this.proceso_actual = null;
  };

  this.suspender_actual = (proceso) => {
    proceso.suspender();
    this.term.ingresar(proceso);
    this.proceso_actual = null;
    $("#proceso-actual").html("");
    $("#semaforo").attr("class", "verde");
    // vuelve al ingresar a la cola
    switch (proceso.prioridad) {
      case 1:
        this.rr.ingresar(
          new Proceso(
            this.timer + 1,
            proceso.prioridad,
            proceso.rafaga_res + 1,
            proceso.nombre
          )
        );
        break;
      case 2:
        this.sjf.ingresar(
          new Proceso(
            this.timer + 1,
            proceso.prioridad,
            proceso.rafaga_res + 1,
            proceso.nombre
          )
        );
        break;
      case 3:
        this.fcfs.ingresar(
          new Proceso(
            this.timer + 1,
            proceso.prioridad,
            proceso.rafaga_res + 1,
            proceso.nombre
          )
        );
        break;
    }
  };

  this.verificar_prioridad = () => {
    if (!this.rr.estaVacia() && this.proceso_actual.prioridad > 1) {
      this.suspender_actual(this.proceso_actual);
    } else if (!this.sjf.estaVacia() && this.proceso_actual.prioridad > 2) {
      this.suspender_actual(this.proceso_actual);
    }
  };

  this.analizar_envejecimiento = () => {
    const primer_sjf = this.sjf.primero();
    const primer_fcfs = this.fcfs.primero();
    let proceso;
    if (
      primer_sjf &&
      this.timer - primer_sjf.obj.llegada >= this.valor_envejecimiento
    ) {
      proceso = primer_sjf.obj;
      this.sjf.atender();
      this.rr.ingresar(
        new Proceso(
          this.timer + 1,
          proceso.prioridad - 1,
          proceso.rafaga_res + 1,
          proceso.nombre
        )
      );
      this.agregarEnvejecido(proceso, this.timer + 1);
    }
    if (
      primer_fcfs &&
      this.timer - primer_fcfs.obj.llegada >= this.valor_envejecimiento
    ) {
      proceso = primer_fcfs.obj;
      this.fcfs.atender();
      this.sjf.ingresar(
        new Proceso(
          this.timer + 1,
          proceso.prioridad - 1,
          proceso.rafaga_res + 1,
          proceso.nombre
        )
      );
      this.agregarEnvejecido(proceso, this.timer + 1);
    }
  };

  this.agregarEnvejecido = (proceso, tiempo) => {
    this.envejecimiento.push({
      antPrioridad: proceso.prioridad,
      nuevaPrioridad: proceso.prioridad - 1,
      nombre: proceso.nombre,
      tiempo: tiempo,
    });
  };

  this.actualizar_envejecimiento = () => {
    cadena = "";
    this.envejecimiento.forEach(
      ({ antPrioridad, nuevaPrioridad, nombre, tiempo }) => {
        cadena += "<tr>";
        cadena += "<th>" + nombre + "</th>";
        cadena += "<th>" + tiempo + "</th>";
        cadena += "<td>" + antPrioridad + "</td>";
        cadena += "<td>" + nuevaPrioridad + "</td>";
        cadena += "</tr>";
      }
    );

    $("#envejecimiento").html(cadena);
  };

  this.actualizar_cola = (tipo) => {
    cadena = "";
    switch (tipo) {
      case "rr":
        lista = this.rr.enlistar();
        lista.forEach((nodo, indice, array) => {
          proceso = nodo.obj;

          cadena += "<tr>";
          cadena += "<th>" + proceso.nombre + "</th>";
          cadena += "<td>" + proceso.llegada + "</td>";
          cadena += "<td>" + proceso.rafaga + "</td>";
          cadena += "</tr>";
        });

        $("#robin").html(cadena);
        break;
      case "sjf":
        lista = this.sjf.enlistar();
        lista.forEach((nodo, indice, array) => {
          proceso = nodo.obj;

          cadena += "<tr>";
          cadena += "<th>" + proceso.nombre + "</th>";
          cadena += "<td>" + proceso.llegada + "</td>";
          cadena += "<td>" + proceso.rafaga + "</td>";
          cadena += "</tr>";
        });

        $("#sjf").html(cadena);
        break;
      case "fcfs":
        lista = this.fcfs.enlistar();
        lista.forEach((nodo, indice, array) => {
          proceso = nodo.obj;

          cadena += "<tr>";
          cadena += "<th>" + proceso.nombre + "</th>";
          cadena += "<td>" + proceso.llegada + "</td>";
          cadena += "<td>" + proceso.rafaga + "</td>";
          cadena += "</tr>";
        });

        $("#fcfs").html(cadena);
        break;
      case "bloqueo":
        lista = this.bloq.enlistar();
        lista.forEach((nodo, indice, array) => {
          proceso = nodo.obj;

          cadena += "<tr>";
          cadena += "<th>" + proceso.nombre + "</th>";
          cadena += "<td>" + proceso.prioridad + "</td>";
          cadena += "<td>" + proceso.llegada + "</td>";
          cadena += "<td>" + proceso.rafaga + "</td>";
          cadena += "</tr>";
        });

        $("#bloqueados").html(cadena);
        break;
    }
  };

  this.actualizar_general = () => {
    cola = new Cola();
    lista = this.term.enlistar();
    lista.forEach((nodo, indice, array) => {
      proceso = nodo.obj;
      cola.ingresar(proceso);
    });

    if (this.proceso_actual != null) cola.ingresar(this.proceso_actual);

    lista = this.rr.enlistar();
    lista.forEach((nodo, indice, array) => {
      proceso = nodo.obj;
      cola.ingresar(proceso);
    });

    lista = this.sjf.enlistar();
    lista.forEach((nodo, indice, array) => {
      proceso = nodo.obj;
      cola.ingresar(proceso);
    });

    lista = this.fcfs.enlistar();
    lista.forEach((nodo, indice, array) => {
      proceso = nodo.obj;
      cola.ingresar(proceso);
    });

    this.general = cola;
  };

  this.obtener_tabla_general = () => {
    lista = this.general.enlistar();
    cadena = "";
    lista.forEach((nodo, indice, array) => {
      proceso = nodo.obj;
      if (nodo.ant.obj == null) {
        proceso.calcular(0);
      } else {
        tiempo_ant = nodo.ant.obj.final;
        if (tiempo_ant < proceso.llegada) {
          if (proceso === this.general.ultimo().obj)
            proceso.calcular(this.timer);
          else proceso.calcular(proceso.llegada);
        } else proceso.calcular(tiempo_ant);
      }

      cadena += "<tr>";
      cadena += "<th>" + proceso.nombre + "</th>";
      cadena += "<td>" + proceso.prioridad + "</td>";
      cadena += "<td>" + proceso.llegada + "</td>";
      cadena += "<td>" + proceso.rafaga_ini + "</td>";
      if (proceso.estado !== "Esperando") {
        cadena += "<td>" + proceso.comienzo + "</td>";
      } else {
        cadena += "<td></td>";
      }
      if (proceso.estado !== "Esperando" && proceso.estado !== "Ejecutando") {
        cadena += "<td>" + proceso.final + "</td>";
        cadena += "<td>" + proceso.retorno + "</td>";
        cadena += "<td>" + proceso.espera + "</td>";
      } else {
        cadena += "<td></td>";
        cadena += "<td></td>";
        cadena += "<td></td>";
      }

      cadena +=
        "<td class='" + proceso.estado + "'>" + proceso.estado + "</td>";
      cadena += "</tr>";
    });

    $("#calculos").html(cadena);
  };

  this.obtener_tabla_inicial = () => {
    lista = this.general.enlistar();
    cadena = "";
    lista.forEach((nodo, indice, array) => {
      proceso = nodo.obj;
      if (nodo.ant.obj == null) {
        proceso.calcular(0);
      } else {
        tiempo_ant = nodo.ant.obj.final;
        if (tiempo_ant < proceso.llegada) {
          if (proceso === this.general.ultimo().obj)
            proceso.calcular(this.timer);
          else proceso.calcular(proceso.llegada);
        } else proceso.calcular(tiempo_ant);
      }

      cadena += "<tr>";
      cadena += "<th>" + proceso.nombre + "</th>";
      cadena += "<td>" + proceso.prioridad + "</td>";
      cadena += "<td>" + proceso.llegada + "</td>";
      cadena += "<td>" + proceso.rafaga + "</td>";
      cadena += "<td>" + "" + "</td>";
      cadena += "<td>" + "" + "</td>";
      cadena += "<td>" + "" + "</td>";
      cadena += "<td>" + "" + "</td>";
      cadena +=
        "<td class='" + proceso.estado + "'>" + proceso.estado + "</td>";
      cadena += "</tr>";
    });

    $("#calculos").html(cadena);
  };

  this.obtener_gantt = () => {
    // Agregar un numero mas al diagrama
    timeline = $("#timeline");
    timeline_txt = timeline.html();
    timeline_txt += "<th>" + this.timer + "</th>";
    timeline.html(timeline_txt);

    lista = this.general.enlistar();
    cadena = "";
    lista.forEach((nodo, indice, array) => {
      proceso = nodo.obj;
      cadena += "<tr>";
      cadena += "<td>" + proceso.nombre + "</td>";
      for (let i = 0; i < proceso.llegada; i++) cadena += "<td></td>";
      fila = proceso.fila;
      fila.forEach((col, indice, array) => {
        cadena += "<td class='";
        if (col == 0) cadena += "esperando";
        else if (col == 1) cadena += "ejecutando";
        else if (col == 2) cadena += "bloqueado";
        else if (col == 3) cadena += "suspendido";
        cadena += "'></td>";
      });
      cadena += "</tr>";
    });

    $("#gantt").html(cadena);
  };
}
