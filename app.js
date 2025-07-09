// app.js
document.addEventListener('DOMContentLoaded', function () {
  if (window.Reveal) {
    Reveal.on('slidechanged', event => {
      // Exemplo: alerta no slide 3
      if (event.indexh === 2) {
        alert('Participe na enquete ao vivo!');
      }
      // Exemplo: destacar título do slide final
      if (event.indexh === 14) {
        document.querySelector('.highlight').style.color = '#06d6a0';
      }
    });
  }
});

