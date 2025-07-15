window.addEventListener("DOMContentLoaded", function () {
  const savedContent = sessionStorage.getItem("activeContent") || "Home";
  showContent(savedContent);
});

document.querySelectorAll(".nav-button").forEach(h2 => {
    h2.addEventListener("click", function() {
      showContent( this.textContent)
    });
});

function showContent(name) {
  sessionStorage.setItem("activeContent", name);

  // Show/hide main content
  document.querySelectorAll('#home-screen > div').forEach(el => {
    el.style.display = (el.id === name) ? 'block' : 'none';
  });

  // Show/hide side content
  const sideMap = {
    "Home": "home-side-content",
    "Create Custom Statistic": "create-side-content",
    "Predictions": "predictions-side-content",
    "Data Visualizations": "visualizations-side-content",
    "Explore Datasets": "data-side-content"
  };
  Object.values(sideMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  if (sideMap[name]) {
    const el = document.getElementById(sideMap[name]);
    if (el) el.style.display = "block";
  }

  // Underline nav
  document.querySelectorAll('.nav-button').forEach(el => {
    el.style.textDecoration = (el.textContent === name) ? 'underline' : 'none';
  });
}

// let expression = ''; // Removed duplicate declaration
document.getElementById('loadBtn').addEventListener('click', async () => {
  const container = document.getElementById('CreateCustomStatistic');
  const columnButtonContainer = document.getElementById('numeric-column-buttons');
  const expressionElem = document.getElementById('expression');

  const columnOrder = ['Name', 'Start-End', 'All-Stars', 'MVPs', 'Pts', 'Ast', 'Reb', 'Stl', 'Blk', 'Tov', 'PF', 'FGm', 'FGa', 'FG%', 'FG3m', 'FG3a', 'FG3%', 'FTm', 'FTa', 'FT%', 'mins', 'Games'];

  try {
    const response = await fetch('/all_time');
    if (!response.ok) {
      throw new Error('Network response was not OK');
    }

    const data = await response.json();
    if (data.length === 0) {
      container.innerHTML += '<p>No data found in CSV.</p>';
      return;
    }

    // Identify numeric columns
    const numericColumns = [];
    const sampleRow = data[0];
    for (const [key, value] of Object.entries(sampleRow)) {
      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        numericColumns.push(key);
      }
    }

    // Clear previous buttons to prevent duplicates
    columnButtonContainer.innerHTML = '';
    // Build numeric column buttons
    numericColumns.forEach(col => {
      const btn = document.createElement('button');
      btn.textContent = col;
      btn.style.margin = '5px';
      btn.addEventListener('click', () => {
        expression += `[${col}]`;
        expressionElem.innerText = expression;
      });
      columnButtonContainer.appendChild(btn);
    });

    // --- RENDER TABLE ---
    const table = document.getElementById('csvTable');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    columnOrder.forEach(key => {
      const th = document.createElement('th');
      th.textContent = key;
      th.style.border = '1px solid black';
      th.style.padding = '4px';
      thead.appendChild(th);
    });

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
    console.error('Error loading CSV data:', error);
  }
});



let expression = '';

const expressionElem = document.getElementById('expression');
const buttons = document.querySelectorAll('#input-button-container button');

buttons.forEach(button => {
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
  const nameInput = document.getElementById('statName');
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
      body: JSON.stringify({ name, expression })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Unknown error');
    }

    const data = await response.json();

    // Use fixed column order after custom stat name
    const fixedColumnOrder = ['Name', 'Start-End', 'All-Stars', 'MVPs', 'Pts', 'Ast', 'Reb', 'Stl', 'Blk', 'Tov', 'PF', 'FGm', 'FGa', 'FG%', 'FG3m', 'FG3a', 'FG3%', 'FTm', 'FTa', 'FT%', 'mins', 'Games'];
    const columnOrder = [name, ...fixedColumnOrder.filter(k => k !== name)];

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
