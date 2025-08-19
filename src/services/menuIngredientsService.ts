import { supabase } from "../config/supabase";

export const getMenuIngredients = async () => {
    const {data, error} = await supabase.from('menu_ingredients').select('*');
    if (error) {
        console.error('Error fetching menu ingredients:', error);
        return [];
    }
    return data;
};
