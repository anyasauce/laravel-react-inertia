import React, { useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout"; 
import { Button } from "@/components/ui/button";
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    getDay, 
    subMonths, 
    addMonths, 
    isSameMonth, 
    isSameDay,
    startOfWeek,
    endOfWeek,
    addDays
} from "date-fns"; 
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Settings, MoreVertical } from "lucide-react";
const cn = (...classes) => classes.filter(Boolean).join(' '); 
const GridCalendar = ({ initialDate }) => {
    const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
    const [viewMode, setViewMode] = useState('Month');

    const firstDayCurrentMonth = startOfMonth(currentMonth);
    const lastDayCurrentMonth = endOfMonth(currentMonth);
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const hours = useMemo(() => {
        const slots = [];
        for (let i = 0; i < 24; i++) {
            slots.push(format(new Date(2023, 0, 1, i), 'ha'));
        }
        return slots;
    }, []);
    
    const eventsForDate = useCallback(() => {
        return []; 
    }, []);



    const prevMonthDate = (days) => {
        const date = new Date(currentMonth);
        date.setDate(date.getDate() - days);
        return date.getDate();
    };

    const nextMonthDate = (days) => {
        const date = new Date(currentMonth);
        date.setDate(date.getDate() + days);
        return date.getDate();
    };

    const monthDays = useMemo(() => {
        const startDay = getDay(firstDayCurrentMonth);
        const startDate = subMonths(firstDayCurrentMonth, 1);
        startDate.setDate(prevMonthDate(startDay));
        
        const endDate = addMonths(lastDayCurrentMonth, 1);
        endDate.setDate(nextMonthDate(41 - startDay));

        return eachDayOfInterval({ start: startDate, end: endDate }).slice(0, 42);
    }, [currentMonth]);
    
    const currentWeekDays = useMemo(() => {
        const start = startOfWeek(currentMonth, { weekStartsOn: 0 });
        const end = endOfWeek(currentMonth, { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);


    const handlePrev = useCallback(() => {
        if (viewMode === 'Month') {
            setCurrentMonth(prev => subMonths(prev, 1));
        } else if (viewMode === 'Week') {
            setCurrentMonth(prev => subDays(prev, 7));
        } else if (viewMode === 'Day') {
            setSelectedDate(prev => addDays(prev, -1));
            setCurrentMonth(prev => addDays(prev, -1));
        }
    }, [viewMode]);

    const handleNext = useCallback(() => {
        if (viewMode === 'Month') {
            setCurrentMonth(prev => addMonths(prev, 1));
        } else if (viewMode === 'Week') {
            setCurrentMonth(prev => addDays(prev, 7));
        } else if (viewMode === 'Day') {
            setSelectedDate(prev => addDays(prev, 1));
            setCurrentMonth(prev => addDays(prev, 1));
        }
    }, [viewMode]);

    const handleGoToToday = useCallback(() => {
        const today = new Date();
        setCurrentMonth(today);
        setSelectedDate(today);
    }, []);

    const handleSetViewMode = useCallback((mode) => {
        setViewMode(mode);
        if (mode !== 'Month') {
            setCurrentMonth(selectedDate);
        }
    }, [selectedDate]);


    const ViewModeButtons = () => (
        <div className="flex items-center gap-px p-1 rounded-md bg-muted">
            <button 
                onClick={() => handleSetViewMode('Day')} 
                className={cn("py-2 px-5 rounded-lg text-sm font-medium transition-all duration-300", 
                    viewMode === 'Day' ? 'bg-background text-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:bg-muted/70')}
            >
                Day
            </button>
            <button 
                onClick={() => handleSetViewMode('Week')} 
                className={cn("py-2 px-5 rounded-lg text-sm font-medium transition-all duration-300", 
                    viewMode === 'Week' ? 'bg-background text-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:bg-muted/70')}
            >
                Week
            </button>
            <button 
                onClick={() => handleSetViewMode('Month')} 
                className={cn("py-2.5 px-5 rounded-lg text-sm font-medium transition-all duration-300", 
                    viewMode === 'Month' ? 'bg-background text-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:bg-muted/70')}
            >
                Month
            </button>
        </div>
    );

    // --- Render Functions for Different Views ---

    const renderMonthView = () => (
        <div className="border border-border/70 rounded-xl overflow-hidden shadow-2xl bg-card">
            
            {/* Days of the Week Header */}
            <div className="grid grid-cols-7 border-b border-border/70 bg-muted/50">
                {daysOfWeek.map(day => (
                    <div key={day} className="p-3.5 flex flex-col sm:flex-row items-center justify-center border-r border-border/70 last:border-r-0">
                        <span className="text-sm font-medium text-muted-foreground">{day}</span>
                    </div>
                ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-border/70 divide-y">
                {monthDays.map((date, index) => {
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const isToday = isSameDay(date, new Date());
                    const isDaySelected = isSameDay(date, selectedDate);
                    
                    const cellClasses = cn(
                        "p-1 sm:p-3.5 xl:aspect-auto lg:h-32 flex justify-between flex-col max-lg:items-center min-h-[70px] transition-all duration-300 cursor-pointer",
                        "hover:bg-accent/50",
                        !isCurrentMonth ? "bg-muted/20" : "bg-card",
                        isDaySelected ? "bg-primary/10 ring-2 ring-primary border-primary z-10" : "",
                        isToday && !isDaySelected ? "border-2 border-primary/50" : ""
                    );

                    const dateNumberClasses = cn(
                        "text-xs font-semibold flex items-center justify-center w-7 h-7 rounded-full transition-all",
                        isDaySelected ? "bg-primary text-primary-foreground" : "",
                        isCurrentMonth && !isDaySelected ? "text-foreground" : "text-muted-foreground/70",
                        isToday && !isDaySelected ? "text-primary border border-primary" : ""
                    );

                    return (
                        <div 
                            key={index} 
                            className={cellClasses}
                            onClick={() => setSelectedDate(date)}
                        >
                            <div className="flex w-full justify-end max-lg:justify-center">
                                <span className={dateNumberClasses}>
                                    {format(date, 'd')}
                                </span>
                            </div>
                            <div className="mt-1 flex flex-col items-center lg:items-start gap-1">
                                {/* Placeholder for events */}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderDayView = () => (
        <div className="border border-border/70 rounded-xl overflow-hidden shadow-2xl bg-card">
            {/* Day Header is already in the main title area */}
            <div className="flex">
                {/* Time Axis */}
                <div className="flex flex-col w-12 sm:w-16 shrink-0 text-right pr-2 pt-4 bg-muted/50 border-r border-border/70">
                    {hours.map((hour, index) => (
                        <div 
                            key={index} 
                            className="h-16 text-xs text-muted-foreground relative -mt-2"
                        >
                            {hour}
                        </div>
                    ))}
                </div>
                {/* Schedule Body */}
                <div className="grow overflow-y-auto max-h-[80vh] pt-4">
                    <div className="relative">
                        {/* Hour Lines */}
                        {hours.map((_, index) => (
                            <div 
                                key={index} 
                                className="h-16 border-b border-border/70 group hover:bg-accent/10 transition-colors"
                            >
                                {/* Event Placement Area for {format(selectedDate, 'PP')} */}
                            </div>
                        ))}
                        {/* Current Time Line (Mock) */}
                        {isSameDay(selectedDate, new Date()) && (
                            <div 
                                className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 transition-all duration-500"
                                style={{ top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 4}rem` }} // 16px/hr * 4 = 64px (h-16)
                            >
                                <span className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></span>
                            </div>
                        )}
                        <div className="absolute top-0 left-0 right-0 bottom-0 p-2">
                             <div className="p-2 bg-primary/20 text-primary-foreground text-xs rounded-lg shadow-md absolute w-[calc(100%-1rem)]" style={{ top: '10rem', height: '4rem' }}>
                                 <p className="font-semibold">Team Meeting</p>
                                 <p className="text-[10px] text-primary/80">10:00 AM - 11:00 AM</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderWeekView = () => (
        <div className="border border-border/70 rounded-xl overflow-hidden shadow-2xl bg-card">
            
            {/* Week Days Header */}
            <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] border-b border-border/70 bg-muted/50">
                <div className="w-12 sm:w-16 border-r border-border/70"></div> {/* Corner for Time Axis */}
                {currentWeekDays.map((date, index) => {
                    const isToday = isSameDay(date, new Date());
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                        <div 
                            key={index} 
                            className={cn(
                                "p-2 sm:p-3 flex flex-col items-center justify-center border-r border-border/70 last:border-r-0 cursor-pointer transition-colors",
                                isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent/50"
                            )}
                            onClick={() => setSelectedDate(date)}
                        >
                            <span className="text-xs font-medium text-muted-foreground">{format(date, 'EEE')}</span>
                            <span className={cn("text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full", isToday ? "bg-primary text-primary-foreground" : "")}>
                                {format(date, 'd')}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            {/* Week Schedule Body */}
            <div className="flex max-h-[80vh] overflow-y-auto">
                {/* Time Axis */}
                <div className="flex flex-col w-12 sm:w-16 shrink-0 text-right pr-2 pt-4 bg-muted/50 border-r border-border/70">
                    {hours.map((hour, index) => (
                        <div 
                            key={index} 
                            className="h-16 text-xs text-muted-foreground relative -mt-2"
                        >
                            {hour}
                        </div>
                    ))}
                </div>
                {/* Day Grid */}
                <div className="grid grid-cols-7 grow pt-4 divide-x divide-border/70 relative">
                    {currentWeekDays.map((date, colIndex) => (
                        <div key={colIndex} className="relative">
                            {/* Hourly Slots (Background grid) */}
                            {hours.map((_, rowIndex) => (
                                <div 
                                    key={rowIndex} 
                                    className="h-16 border-b border-border/70 group hover:bg-accent/10 transition-colors"
                                >
                                    {/* Event placement for this specific hour/day */}
                                </div>
                            ))}
                            {/* Current Time Line (Only on today's column) */}
                            {isSameDay(date, new Date()) && (
                                <div 
                                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 transition-all duration-500"
                                    style={{ top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 4}rem` }}
                                >
                                    <span className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></span>
                                </div>
                            )}
                            {/* Mock Event for a selected day in the week */}
                            {isSameDay(date, addDays(currentWeekDays[0], 2)) && (
                                 <div className="absolute top-0 left-0 right-0 p-1">
                                     <div className="p-1 bg-blue-500/80 text-white text-[10px] rounded-md shadow-md" style={{ top: '10rem', height: '4rem' }}>
                                         <p className="font-semibold">Project Review</p>
                                         <p className="text-[9px]">10:00 - 11:00</p>
                                     </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    

    // --- Main Render Block ---
    
    // Determine the content based on view mode
    let calendarContent;
    let titleContent;
    
    if (viewMode === 'Day') {
        calendarContent = renderDayView();
        titleContent = format(selectedDate, 'PPPP'); // e.g., Wednesday, November 26th, 2025
    } else if (viewMode === 'Week') {
        calendarContent = renderWeekView();
        const weekStart = format(currentWeekDays[0], 'MMM d');
        const weekEnd = format(currentWeekDays[6], 'MMM d, yyyy');
        titleContent = `Week of ${weekStart} - ${weekEnd}`;
    } else { // Month
        calendarContent = renderMonthView();
        titleContent = format(currentMonth, 'MMMM yyyy');
    }

    return (
        <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-2">
                
                {/* Left Controls: Title, Navigation, Today Button */}
                <div className="flex items-center gap-4">
                    <h5 className="text-xl md:text-2xl leading-8 font-semibold text-foreground whitespace-nowrap">
                        {titleContent}
                    </h5>
                    <div className="flex items-center gap-2">
                        {/* Go to Today */}
                        <Button 
                            onClick={handleGoToToday}
                            className="hidden md:flex py-2 pl-2 pr-3 rounded-lg bg-muted text-muted-foreground border border-border items-center gap-1.5 text-xs font-medium hover:bg-muted/80 transition-all duration-500"
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Today
                        </Button>
                        
                        {/* Previous/Next Navigation */}
                        <button 
                            onClick={handlePrev}
                            className="p-1.5 text-muted-foreground rounded-full transition-all duration-300 hover:bg-muted hover:text-foreground"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <button 
                            onClick={handleNext}
                            className="p-1.5 text-muted-foreground rounded-full transition-all duration-300 hover:bg-muted hover:text-foreground"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Right Controls: View Modes, Settings */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                        
                        {/* Settings Button Placeholder */}
                        <button 
                            className="p-2 text-muted-foreground flex items-center justify-center transition-all duration-300 hover:text-foreground rounded-full hover:bg-muted"
                            title="Calendar Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        
                        <span className="w-px h-7 bg-border hidden sm:block"></span>
                        
                        {/* View Mode Buttons (Day/Week/Month) */}
                        <ViewModeButtons />
                    </div>
                </div>
            </div>

            {/* Calendar Content based on View Mode */}
            {calendarContent}
        </div>
    );
};


// --- Calendar Page Component ---

export default function CalendarPage() {
    // Set a fixed date for consistent testing if needed, or use new Date() for current day
    const [selectedDate, setSelectedDate] = useState(new Date(2025, 10, 26)); // Nov 26, 2025

    // Function to safely display the selected date
    const formattedSelectedDate = selectedDate 
        ? format(selectedDate, 'PPP') 
        : 'Select a Date';

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-8 p-4 md:p-8 max-w-full mx-auto">
                
                {/* Header (Dashboard Style) */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b pb-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Company Calendar
                        </h2>
                        <p className="text-muted-foreground">
                            View and manage team events and milestones.
                        </p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6">
                    
                    {/* The Custom Grid Calendar */}
                    <div className="w-full">
                        <GridCalendar initialDate={selectedDate} />
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}