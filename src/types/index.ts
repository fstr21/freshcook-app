export interface Ingredient {
  id: string;
  name: string;
  detected?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}