"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
const formSchema = z.object({
    name: z.string().min(2, "Contest name must be at least 2 characters."),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date/time"),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date/time"),
});
export default function ContestForm({ onSubmit }) {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            startTime: "",
            endTime: "",
        },
    });
    const handleFormSubmit = (values) => {
        const newContest = {
            id: Math.random().toString(36).substr(2, 9),
            name: values.name,
            startTime: new Date(values.startTime).toISOString(),
            endTime: new Date(values.endTime).toISOString(),
        };
        onSubmit(newContest);
        form.reset();
    };
    return (<Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem>
              <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Contest Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. World Code Cup" className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary transition-all" {...field}/>
              </FormControl>
              <FormMessage />
            </FormItem>)}/>
        <div className="grid grid-cols-1 gap-6">
          <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem>
                <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Start Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary transition-all" {...field}/>
                </FormControl>
                <FormMessage />
              </FormItem>)}/>
          <FormField control={form.control} name="endTime" render={({ field }) => (<FormItem>
                <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">End Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary transition-all" {...field}/>
                </FormControl>
                <FormMessage />
              </FormItem>)}/>
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/80 transition-all purple-glow">
          Create Entry
        </Button>
      </form>
    </Form>);
}
