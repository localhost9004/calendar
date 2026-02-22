
'use server'
import { supabase } from '@/lib/supabase'

export async function getEvents({
  eventTypes,
  platforms,
  search,
}: {
  eventTypes?: string[];
  platforms?: string[];
  search?: string;
} = {}) {
  let query = supabase.from('events').select('*')

  // Past event handling: only load events from the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  query = query.gte('start_time', thirtyDaysAgo.toISOString())

  if (eventTypes && eventTypes.length > 0) {
    query = query.in('event_type', eventTypes)
  }

  if (platforms && platforms.length > 0) {
    query = query.in('platform', platforms)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  query = query.order('start_time', { ascending: true })

  const { data: events, error } = await query

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  return events
}

export async function getEventCategories() {
  const { data, error } = await supabase.from('events').select('event_type')
  if (error) {
    console.error('Error fetching event categories:', error)
    return []
  }
  const categories = Array.from(new Set(data.map((item) => item.event_type)))
  return categories
}

export async function getPlatforms() {
  const { data, error } = await supabase.from('events').select('platform')
  if (error) {
    console.error('Error fetching platforms:', error)
    return []
  }
  const platforms = Array.from(new Set(data.map((item) => item.platform)))
  return platforms
}
