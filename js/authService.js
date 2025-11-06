/**
 * js/authService.js
 *
 * Handles user authentication, session management, and role-based permissions.
 */

import { calendarState } from './calendarState.js';
import { showCustomAlert } from './uiService.js';

// Current user session
let currentUser = null;

/**
 * Initialize authentication - check if user is logged in
 */
export function initAuth() {
    const userId = sessionStorage.getItem('currentUserId');
    
    if (!userId) {
        // Redirect to user selection if no user is logged in
        window.location.href = 'index.html';
        return null;
    }
    
    // Load user data
    const user = calendarState.getTeamMemberById(userId);
    
    if (!user) {
        // User not found, redirect to selection
        sessionStorage.removeItem('currentUserId');
        window.location.href = 'index.html';
        return null;
    }
    
    currentUser = user;
    return user;
}

/**
 * Get current logged in user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Check if current user has a specific role
 */
export function hasRole(role) {
    if (!currentUser) return false;
    return currentUser.role === role;
}

/**
 * Check if current user is admin
 */
export function isAdmin() {
    return hasRole('admin');
}

/**
 * Check if current user is coordinator
 */
export function isCoordinator() {
    return hasRole('coordinator');
}

/**
 * Check if current user is therapist
 */
export function isTherapist() {
    return hasRole('therapist');
}

/**
 * Check if user can edit/delete an event
 * @param {object} event - The event to check
 */
export function canModifyEvent(event) {
    if (!currentUser || !event) return false;
    
    // Admins and coordinators can modify any event
    if (isAdmin() || isCoordinator()) {
        return true;
    }
    
    // Therapists can only modify events they are assigned to
    if (isTherapist()) {
        const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
        return teamMemberIds.includes(currentUser.id);
    }
    
    return false;
}

/**
 * Check if user can create events
 */
export function canCreateEvent() {
    if (!currentUser) return false;
    // All roles can create events
    return true;
}

/**
 * Check if user can view event details
 */
export function canViewEventDetails(event) {
    if (!currentUser) return false;
    // All users can view all event details
    return true;
}

/**
 * Show permission denied message
 */
export function showPermissionDenied(action = 'această acțiune') {
    const messages = {
        'therapist': `Nu aveți permisiunea să ${action}. Puteți edita doar evenimentele la care sunteți asignat.`,
        'coordinator': `Nu aveți permisiunea să ${action}.`,
        'admin': `Nu aveți permisiunea să ${action}.`
    };
    
    const message = messages[currentUser?.role] || `Nu aveți permisiunea să ${action}.`;
    showCustomAlert(message, 'Acces Restricționat');
}

/**
 * Get events for current user (filtered by assignment for therapists)
 */
export function getMyEvents() {
    const { events } = calendarState.getState();
    
    if (!currentUser) return [];
    
    // Admins and coordinators see all events
    if (isAdmin() || isCoordinator()) {
        return events;
    }
    
    // Therapists see only their events
    if (isTherapist()) {
        return events.filter(event => {
            const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            return teamMemberIds.includes(currentUser.id);
        });
    }
    
    return events;
}

/**
 * Get today's schedule for current user
 */
export function getTodaysSchedule() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const { events } = calendarState.getState();
    
    if (!currentUser) return [];
    
    // Filter events for today
    let todaysEvents = events.filter(event => event.date === dateStr);
    
    // For therapists, filter only their events
    if (isTherapist()) {
        todaysEvents = todaysEvents.filter(event => {
            const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            return teamMemberIds.includes(currentUser.id);
        });
    }
    
    // Sort by start time
    todaysEvents.sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime.localeCompare(b.startTime);
    });
    
    return todaysEvents;
}

/**
 * Calculate statistics for current user
 */
export function getUserStats() {
    const { events, currentDate } = calendarState.getState();
    
    if (!currentUser) return { totalSessions: 0, attendance: 0, pendingReports: 0 };
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Filter events for current month
    let monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
    
    // For therapists, filter only their events
    if (isTherapist()) {
        monthEvents = monthEvents.filter(event => {
            const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            return teamMemberIds.includes(currentUser.id);
        });
    }
    
    // Calculate statistics
    const totalSessions = monthEvents.length;
    
    // Calculate attendance (events with attendance data)
    let totalWithAttendance = 0;
    let presentCount = 0;
    
    monthEvents.forEach(event => {
        if (event.attendance) {
            const attendanceValues = Object.values(event.attendance);
            totalWithAttendance += attendanceValues.length;
            presentCount += attendanceValues.filter(status => status === 'present').length;
        }
    });
    
    const attendance = totalWithAttendance > 0 
        ? Math.round((presentCount / totalWithAttendance) * 100) 
        : 100;
    
    // Pending reports (events without program scores)
    const pendingReports = monthEvents.filter(event => {
        if (!event.programIds || event.programIds.length === 0) return false;
        if (!event.programScores) return true;
        return Object.keys(event.programScores).length < event.programIds.length;
    }).length;
    
    return {
        totalSessions,
        attendance,
        pendingReports
    };
}

/**
 * Logout current user
 */
export function logout() {
    sessionStorage.removeItem('currentUserId');
    currentUser = null;
    window.location.href = 'index.html';
}