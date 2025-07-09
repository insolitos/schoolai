// app.js
document.addEventListener('DOMContentLoaded', function () {
  // Exemplo: Quiz simples no slide da enquete
  const quizBtn = document.getElementById('quiz-btn');
  if (quizBtn) {
    quizBtn.addEventListener('click', function () {
      const resposta = prompt('Qual a principal vantagem do SchoolAI para professores?');
      if (resposta && resposta.toLowerCase().includes('tempo')) {
        alert('Correto! O SchoolAI poupa tempo nas tarefas administrativas.');
      } else {
        alert('Sugestão: reveja o slide de benefícios para professores.');
      }
    });
  }
});
