/*
  # User Data Tables

  1. New Tables
    - `favorite_recipes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `recipe_id` (text, unique recipe identifier)
      - `title` (text)
      - `description` (text)
      - `ingredients` (text array)
      - `instructions` (text array)
      - `cooking_time` (integer)
      - `servings` (integer)
      - `difficulty` (text)
      - `created_at` (timestamp)

    - `ingredient_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `ingredients` (text array)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create favorite_recipes table
CREATE TABLE IF NOT EXISTS favorite_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  ingredients text[] NOT NULL,
  instructions text[] NOT NULL,
  cooking_time integer NOT NULL,
  servings integer NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Create ingredient_history table
CREATE TABLE IF NOT EXISTS ingredient_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingredients text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE favorite_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_history ENABLE ROW LEVEL SECURITY;

-- Create policies for favorite_recipes
CREATE POLICY "Users can manage their own favorite recipes"
  ON favorite_recipes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for ingredient_history
CREATE POLICY "Users can manage their own ingredient history"
  ON ingredient_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorite_recipes_user_id ON favorite_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_recipes_created_at ON favorite_recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingredient_history_user_id ON ingredient_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_history_created_at ON ingredient_history(created_at DESC);