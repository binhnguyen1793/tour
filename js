document.querySelectorAll('.price-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    const month = this.getAttribute('data-month');

    document.querySelectorAll('.price-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');

    document.querySelectorAll('.table-container').forEach(container => {
      container.style.display = (container.getAttribute('data-month') === month || month === 'Tất cả') ? 'block' : 'none';
    });
  });
});
