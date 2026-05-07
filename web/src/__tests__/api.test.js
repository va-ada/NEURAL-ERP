import { describe, it, expect } from 'vitest';
import { authAPI, attendanceAPI, gradeAPI, careerAPI, adminAPI } from '../services/api';

describe('API module exports', () => {
    it('exports authAPI with required methods', () => {
        expect(authAPI.login).toBeTypeOf('function');
        expect(authAPI.verifyOtp).toBeTypeOf('function');
        expect(authAPI.refresh).toBeTypeOf('function');
        expect(authAPI.forgotPassword).toBeTypeOf('function');
        expect(authAPI.resetPassword).toBeTypeOf('function');
        expect(authAPI.getProfile).toBeTypeOf('function');
    });

    it('exports attendanceAPI with required methods', () => {
        expect(attendanceAPI.getByStudent).toBeTypeOf('function');
        expect(attendanceAPI.getByBatch).toBeTypeOf('function');
        expect(attendanceAPI.getStats).toBeTypeOf('function');
        expect(attendanceAPI.mark).toBeTypeOf('function');
    });

    it('exports gradeAPI with required methods', () => {
        expect(gradeAPI.getByStudent).toBeTypeOf('function');
        expect(gradeAPI.getBySemester).toBeTypeOf('function');
        expect(gradeAPI.getStats).toBeTypeOf('function');
        expect(gradeAPI.create).toBeTypeOf('function');
    });

    it('exports careerAPI with required methods', () => {
        expect(careerAPI.getOpportunities).toBeTypeOf('function');
        expect(careerAPI.getRecommendations).toBeTypeOf('function');
        expect(careerAPI.getApplications).toBeTypeOf('function');
        expect(careerAPI.apply).toBeTypeOf('function');
        expect(careerAPI.getSkills).toBeTypeOf('function');
    });

    it('exports adminAPI with analytics methods', () => {
        expect(adminAPI.getDashboard).toBeTypeOf('function');
        expect(adminAPI.getAnalyticsAttendance).toBeTypeOf('function');
        expect(adminAPI.getAnalyticsPerformance).toBeTypeOf('function');
        expect(adminAPI.getAnalyticsPlacements).toBeTypeOf('function');
        expect(adminAPI.getAnalyticsDepartments).toBeTypeOf('function');
    });
});
