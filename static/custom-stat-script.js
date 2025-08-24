document.addEventListener('DOMContentLoaded', () => {
  let expression = '';

  const expressionElem = document.getElementById('expression');
  const calc_buttons = document.querySelectorAll('#input-button-container button');
  const stat_buttons = document.querySelectorAll('#stat-button-container button');

  calc_buttons.forEach(button => {
    button.addEventListener('click', () => {
      const value = button.innerText;
      if (value === 'Clear') {
        expression = '';
      } else {
        expression += value;
      }
      expressionElem.innerText = expression;
    });
  });

  stat_buttons.forEach(button => {
    button.addEventListener('click', () => {
      const value = "[" + button.innerText + "]";
      
      expressionElem.innerText = expression += value;
    });
  });


  let firstIndex = 1;
  let lastIndex = 50;

  document.getElementById('increase-btn').addEventListener('click', () => {
    firstIndex += 50;
    lastIndex += 50;
    document.getElementById('pagination-display').innerText = `${firstIndex}-${lastIndex}`;
    document.getElementById('submitStat').click(); // Trigger the fetch
  });

  document.getElementById('decrease-btn').addEventListener('click', () => {
    firstIndex = Math.max(1, firstIndex - 50);
    lastIndex = Math.max(50, lastIndex - 50);
    document.getElementById('pagination-display').innerText = `${firstIndex}-${lastIndex}`;
    document.getElementById('submitStat').click(); // Trigger the fetch
  });

  document.addEventListener('keydown', (event) => {
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                        '+', '-', '*', '/', '^', '.', '(', ')', 'Backspace'];

    const key = event.key;

    if (allowedKeys.includes(key)) {
      if (key === 'Backspace') {
        expression = expression.slice(0, -1);
      } else {
        expression += key;
      }
      expressionElem.innerText = expression;
    }

    // Prevent letters and other keys from being typed into other inputs (optional)
    // event.preventDefault();
  });



  document.getElementById('submitStat').addEventListener('click', async () => {
    const nameInput = document.getElementById('stat-name');
    const name = nameInput.value.trim();
    const expression = document.getElementById('expression').innerText.trim();

    if (!name || !expression) {
      alert('Please provide both a name and an expression.');
      return;
    }

    try {
      const response = await fetch('/custom_stat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            name, 
            expression,
            start_index: firstIndex,
            end_index: lastIndex 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error');
      }

      const data = await response.json();

      // Use fixed column order after custom stat name
      const fixedColumnOrder = ['Name', 'Start-End', 'All-Stars', 'MVPs', 'Pts', 'Ast', 'Reb', 'Stl', 'Blk', 'Tov', 'PF', 'FGm', 'FGa', 'FG%', 'FG3m', 'FG3a', 'FG3%', 'FTm', 'FTa', 'FT%', 'mins', 'Games'];
      const columnOrder = ['Index', name, ...fixedColumnOrder.filter(k => k !== name)];

      // RENDER TABLE
      const table = document.getElementById('csvTable');
      const thead = table.querySelector('thead tr');
      const tbody = table.querySelector('tbody');
      thead.innerHTML = '';
      tbody.innerHTML = '';

      // Render headers
      columnOrder.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        th.style.border = '1px solid black';
        th.style.padding = '4px';
        thead.appendChild(th);
      });

      // Render rows
      data.forEach(row => {
        const tr = document.createElement('tr');
        columnOrder.forEach(key => {
          const td = document.createElement('td');
          td.textContent = row[key];
          td.style.border = '1px solid black';
          td.style.padding = '4px';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

    } catch (error) {
      console.error('Error submitting custom stat:', error);
      alert(`Error: ${error.message}`);
    }
  });



});




