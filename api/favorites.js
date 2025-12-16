import { createClient } from '@supabase/supabase-js';

// initialize supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
    // enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { method } = req;
    
    try {
        // get favorites for user
        if (method === 'GET') {
            const userId = req.query.userId || req.url.split('/').pop();
            
            const { data, error } = await supabase
                .from('favorites')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching favorites',
                    error: error.message
                });
            }
            
            return res.status(200).json({
                success: true,
                data: data
            });
        }
        
        // add new favorite
        if (method === 'POST') {
            const { user_id, site_id, site_name, latitude, longitude } = req.body;
            
            // check if favorite already exists
            const { data: existing } = await supabase
                .from('favorites')
                .select('*')
                .eq('user_id', user_id)
                .eq('site_id', site_id)
                .single();
            
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'This station is already in your favorites'
                });
            }
            
            // insert new favorite
            const { data, error } = await supabase
                .from('favorites')
                .insert([{
                    user_id,
                    site_id,
                    site_name,
                    latitude,
                    longitude
                }])
                .select();
            
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error saving favorite',
                    error: error.message
                });
            }
            
            return res.status(201).json({
                success: true,
                message: 'Favorite added successfully',
                data: data[0]
            });
        }
        
        // remove favorite
        if (method === 'DELETE') {
            const id = req.query.id || req.url.split('/').pop();
            
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('id', id);
            
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error removing favorite',
                    error: error.message
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Favorite removed successfully'
            });
        }
        
        // method not allowed
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}