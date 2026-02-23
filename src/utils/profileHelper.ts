import { User } from '../types';

export const isProfileComplete = (user: User): boolean => {
    const commonFields: (keyof User)[] = [
        'name', 'email', 'phone', 'parentnumber', 'registerNumber',
        'department', 'year', 'semester', 'batch', 'gender',
        'photo', 'residencetype'
    ];

    let requiredFields: (keyof User)[] = [...commonFields];

    if (user.residencetype === 'hostel') {
        requiredFields.push('hostelname', 'hostelroomno');
    } else if (user.residencetype === 'day scholar') {
        requiredFields.push('busno', 'boardingpoint');
    }

    const allFilled = requiredFields.every(field => {
        const value = user[field];
        return value !== null && value !== undefined && value !== '' && value !== 0;
    });

    return allFilled;
};
