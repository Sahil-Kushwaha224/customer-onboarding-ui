# CSS Variables System

This directory contains the centralized CSS custom properties (variables) for the entire project.

## Files

- `variables.css` - Contains all CSS custom properties organized by category

## Usage

### Importing Variables

To use the variables in any CSS file, import them at the top:

```css
/* Import global CSS variables */
@import '../../styles/variables.css';
```

### Using Variables

Use the variables with the `var()` function:

```css
.my-component {
  background-color: var(--color-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: var(--transition-fast);
}

.my-button {
  background-color: var(--color-success);
  color: white;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}

.my-button:hover {
  background-color: var(--color-success-hover);
  box-shadow: var(--shadow-button-success);
}
```

## Variable Categories

### Colors
- **Primary**: `--color-primary`, `--color-primary-hover`, `--color-primary-dark`
- **Status**: `--color-success`, `--color-danger`, `--color-warning`, `--color-info`
- **Text**: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- **Background**: `--color-bg-white`, `--color-bg-light`, `--color-bg-body`
- **Borders**: `--color-border`, `--color-border-light`, `--color-border-input`

### Spacing
- **Small**: `--spacing-xs` (4px), `--spacing-sm` (8px), `--spacing-md` (12px)
- **Medium**: `--spacing-lg` (15px), `--spacing-xl` (20px)
- **Large**: `--spacing-2xl` (30px), `--spacing-3xl` (40px), `--spacing-4xl` (60px)

### Typography
- **Font Family**: `--font-family-base`, `--font-family-mono`
- **Font Size**: `--font-size-xs` to `--font-size-4xl`
- **Font Weight**: `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`

### Layout
- **Border Radius**: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-hover`
- **Transitions**: `--transition-fast`, `--transition-slow`

## Benefits

1. **Consistency**: All components use the same design tokens
2. **Maintainability**: Change values in one place to update the entire project
3. **Theming**: Easy to implement dark mode or different themes
4. **Developer Experience**: Autocomplete and IntelliSense support
5. **Performance**: CSS custom properties are more performant than preprocessor variables

## Adding New Variables

When adding new variables to `variables.css`:

1. Group them logically with existing categories
2. Use descriptive names following the existing naming convention
3. Add comments to explain complex or non-obvious values
4. Update this README with new variable categories

## Example: Creating a New Component

```css
/* Import variables */
@import '../../styles/variables.css';

.new-component {
  /* Use semantic color variables */
  background-color: var(--color-bg-white);
  border: 1px solid var(--color-border);
  
  /* Use spacing variables */
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  
  /* Use layout variables */
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  
  /* Use typography variables */
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  
  /* Use transition variables */
  transition: var(--transition-fast);
}

.new-component:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);
}
```

This approach ensures your component follows the design system and is easy to maintain.