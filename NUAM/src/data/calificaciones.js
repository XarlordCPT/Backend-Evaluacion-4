export const initialCalificaciones = Array.from({ length: 10 }, (_, i) => {
  const ejercicios = [2019, 2020, 2021, 2022, 2023, 2024];
  const instrumentos = [
    "Bono Fiscal",
    "Letra del Tesoro",
    "Acción Privada",
    "Certificado de Inversión",
  ];

  return {
    id: i + 1,
    ejercicio: ejercicios[i % ejercicios.length],
    instrumento: instrumentos[i % instrumentos.length],
    fechaPago: `202${i % 5}-0${(i % 9) + 1}-15`,
    descripcion: "Registro simulado",
    secuencia: "SEQ-" + (1000 + i),
    ...Object.fromEntries(
      Array.from({ length: 30 }, (_, j) => [
        `factor${j + 8}`,
        (Math.random() * 1.8 + 0.2).toFixed(2),
      ])
    ),
  };
});
