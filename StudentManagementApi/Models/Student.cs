using System;
using System.ComponentModel.DataAnnotations;

namespace StudentManagementApi.Models
{
    public class Student
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Email { get; set; } = string.Empty;

        public int DepartmentId { get; set; }
        public Department Department { get; set; } = null!;

        public List<StudentSubject> StudentSubjects { get; set; } = new();
    }
}