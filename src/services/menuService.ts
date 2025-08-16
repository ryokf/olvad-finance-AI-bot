import { supabase } from "../config/supabase";

export const getMenu = async () => {
    const {data, error} = await supabase
        .from('menus')
        .select('name, price');

    if (error) {
        console.error("Error fetching menu:", error);
        return [];
    }

    return data;
}
