import { supabase } from "../config/supabase";

export const getIngredients = async () => {
    const {data, error} = await supabase.from('ingredients').select('*');

    if (error) {
        console.error('Error fetching ingredients:', error);
        return [];
    }

    return data;
};
