using System.ComponentModel.DataAnnotations;

namespace StudentManagementApi.Models
{
    public class Department
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public List<Student> Students { get; set; } = new();
    }
}