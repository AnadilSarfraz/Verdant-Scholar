using System.ComponentModel.DataAnnotations;

namespace StudentManagementApi.Models
{
    public class Subject
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public List<StudentSubject> StudentSubjects { get; set; } = new();
    }
}