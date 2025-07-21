import os
import pandas as pd
from flask import request, jsonify
from flask import Flask, render_template, send_from_directory
import utils
import re
import numpy as np

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'  
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():

    files = []
    for filename in os.listdir(UPLOAD_FOLDER):
        if filename.endswith('.csv'):
            size_kb = os.path.getsize(os.path.join(UPLOAD_FOLDER, filename)) / 1024
            files.append({
                'name': filename,
                'size_kb': f"{size_kb:.2f}",
                'download_url': f"/download/{filename}"
            })

    return render_template('index.html',files=files)



@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

@app.route('/all_time')
def get_csv():
    filename = 'uploads/All Time Player Stats 1946-2024.csv' 
    new_order = ['Name', 'Start-End','All-Stars','MVPs','Pts', 'Ast', 'Reb', 'Stl', 'Blk', 'Tov', 'PF', 'FGm','FGa', 'FG%','FG3m','FG3a', 'FG3%', 'FTm','FTa', 'FT%', 'mins', 'Games']  # your desired order
    #Name,id,Start-End,Games,FGm,FGa,FG3m,FG3a,mins,FTm,FTa,Reb,Ast,Stl,Blk,Tov,PF,Pts,FG%,FT%,FG3%,MVPs,All-Stars
    df = pd.read_csv(filename).head(50).fillna(0)
    df = df[new_order]
    #df = df.drop(columns=['id'])

    df = df.round(3)

    data = df.to_dict(orient='records')

    return jsonify(data)

@app.route('/all_time_columns')
def get_all_time_columns():
    filename = 'uploads/All Time Player Stats 1946-2024.csv'
    df = pd.read_csv(filename, nrows=0)
    columns = list(df.columns)
    return jsonify(columns)

@app.route('/custom_stat', methods=['POST'])
def custom_stat():
    data = request.get_json()
    name = data.get('name')
    expression = data.get('expression')

    if not name or not expression:
        return jsonify({'error': 'Missing name or expression'}), 400

    if not utils.is_valid_expression(expression):
        return jsonify({'error': 'Invalid expression'}), 400

    filename = 'uploads/All Time Player Stats 1946-2024.csv'
    df = pd.read_csv(filename).fillna(0)
    new_order = [name, 'Name', 'Start-End','All-Stars','MVPs','Pts', 'Ast', 'Reb', 'Stl', 'Blk', 'Tov', 'PF', 'FGm','FGa', 'FG%','FG3m','FG3a', 'FG3%', 'FTm','FTa', 'FT%', 'mins', 'Games']

    # Replace [ColumnName] in expression with df['ColumnName']
    def replace_column(match):
        col = match.group(1)
        if col not in df.columns:
            raise ValueError(f"Column '{col}' not found in dataset.")
        return f"df['{col}']"

    try:
        normalized_expr = expression.replace('x', '*').replace('^', '**').replace('÷', '/')
        parsed_expr = re.sub(r'\[([^\[\]]+)\]', replace_column, normalized_expr)
        df[name] = eval(parsed_expr)
        # Replace inf, -inf, and nan with 0 in the new stat column
        df[name] = df[name].replace([np.inf, -np.inf, np.nan], 0)
        df = df[new_order]
        df = df.round(3)
        #df = df.drop(columns=['id'])  # Drop 'id' column if it exists
        df = df.sort_values(by=name, ascending=False)  # Sort by new stat, highest to lowest
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    return jsonify(df.to_dict(orient='records'))

@app.route('/mvp-data')
def mvp_data():
    return render_template('mvp-data.html')

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)

