export function exportStudentsToCSV(students) {
  const headers = [
    "ID",
    "Name",
    "Grade",
    "Attendance",
    "GPA",
    "Area",
    "Economic Status",
    "Risk Score",
    "Dropout Probability (%)"
  ];

  const rows = students.map(s => [
    s.id,
    s.name,
    s.grade,
    s.attendance,
    s.gpa,
    s.area,
    s.economicStatus,
    s.riskScore,
    s.dropoutProbability
  ]);

  const csvContent =
    [headers, ...rows]
      .map(row => row.join(","))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "students_report.csv";
  a.click();

  URL.revokeObjectURL(url);
}