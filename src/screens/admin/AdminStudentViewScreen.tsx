import React from 'react';
import StudentListView from '../shared/StudentListScreen';

export const AdminStudentViewScreen = () => (
    <StudentListView endpoint="/admin/students" color="#1e293b" />
);

export default AdminStudentViewScreen;
