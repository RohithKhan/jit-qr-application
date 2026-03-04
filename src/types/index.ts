export interface User {
    name: string;
    staffid: { id: string; name: string };
    registerNumber: string;
    department: string;
    semester: number;
    year: string;
    email: string;
    phone: string;
    photo: string;
    batch: string;
    cgpa?: number;
    arrears?: number;
    gender: 'male' | 'female';
    parentnumber: string;
    residencetype: string;
    hostelname: string;
    hostelroomno: string;
    busno: string;
    boardingpoint: string;
}

export interface StaffUser {
    name: string;
    id: string;
    email: string;
    phone?: string;
    contactNumber?: string;
    department?: string;
    designation?: string;
    qualification?: string;
    experience?: string | number;
    photo?: string;
    gender?: string;
    subjects?: string[];
    skills?: string[];
    achievements?: string[];
}

export interface WardenUser {
    name: string;
    id: string;
    email: string;
    phone?: string;
    designation?: string;
    photo?: string;
}

export interface WatchmanUser {
    name: string;
    id: string;
    email: string;
    phone?: string;
    photo?: string;
}

export interface YearInchargeUser {
    name: string;
    id: string;
    email: string;
    phone?: string;
    department?: string;
    handlingyear?: string[];
    handlingbatch?: string[];
    handlingdepartment?: string[];
    photo?: string;
}

export interface AdminUser {
    name: string;
    id: string;
    email: string;
    phone?: string;
    photo?: string;
}

export interface StudentOutpass {
    _id: string;
    studentId: {
        _id: string;
        name: string;
        registerNumber: string;
        department: string;
        year: string;
        email: string;
        photo?: string;
        residencetype?: string;
        parentnumber?: string;
    };
    reason: string;
    fromDate: string;
    toDate: string;
    fromTime?: string;
    toTime?: string;
    outpassType: string;
    status: string;
    staffApproval?: string;
    wardenApproval?: string;
    yearInchargeApproval?: string;

    // Server-returned populated properties
    staffapprovalstatus?: string;
    yearinchargeapprovalstatus?: string;
    wardenapprovalstatus?: string;
    staffid?: { name: string };
    inchargeid?: { name: string };
    wardenid?: { name: string };
    staffremarks?: string;
    yearinchargeremarks?: string;
    wardenremarks?: string;
    document?: string;
    proof?: string;
    file?: string;

    createdAt: string;
    updatedAt?: string;
    staffComment?: string;
    wardenComment?: string;
    yearInchargeComment?: string;
}

export interface Subject {
    _id: string;
    name: string;
    code: string;
    department: string;
    semester?: number;
    staffId?: {
        _id: string;
        name: string;
    };
    files?: SubjectFile[];
}

export interface SubjectFile {
    _id: string;
    filename: string;
    url: string;
    uploadedAt: string;
}

export interface Notice {
    _id: string;
    title: string;
    content: string;
    createdAt: string;
    staffId?: {
        name: string;
    };
}

export type UserType = 'student' | 'staff' | 'warden' | 'watchman' | 'year_incharge' | 'admin';
