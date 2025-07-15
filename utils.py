# def is_valid_expression(expression: str) -> bool:
#     """
#     Checks if the given mathematical expression is valid.
#     Returns True if valid, False otherwise.
#     Only allows numbers, operators, and parentheses.
#     """
def is_valid_expression(expression: str) -> bool:
    import re
    # Step 1: Normalize the expression
    print(f"Original expression: {expression}")
    expression = expression.replace('x', '*')  # Replace 'x' with '*'
    expression = expression.replace('^', '**') # Replace '^' with '**'
    expression = expression.replace('÷', '/')  # Replace division symbol with '/'

    # Step 2: Check for disallowed characters (allow [variable names])
    allowed_pattern = r'^[\d\s\+\-\*/\^\.\(\)\[\]A-Za-z_]+$'
    if not re.match(allowed_pattern, expression.replace('[', '').replace(']', '').replace(' ', '')):
        return False

    # Step 3: Replace [VarName] with dummy values (e.g., 1)
    def replace_var(match):
        return '1'

    cleaned_expr = re.sub(r'\[[^\[\]]+\]', replace_var, expression)

    # Step 4: Try to evaluate
    try:
        eval(cleaned_expr, {"__builtins__": None}, {})
        return True
    except Exception:
        return False
    
if __name__ == "__main__":
    expr = "[Pts] + [Ast] / 42 + 2 x [Reb]"  # Example expression
    if is_valid_expression(expr):
        print("Valid expression!")
    else:
        print("Invalid expression.")
