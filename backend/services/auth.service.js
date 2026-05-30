import supabase from '../db.js'

export const saveProfile = async ({ id, full_name, phone }) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id, full_name, phone })
    .select()
    .single()
  if (error) throw error
  return data
}

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}
