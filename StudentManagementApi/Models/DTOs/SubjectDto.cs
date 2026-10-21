using System.ComponentModel.DataAnnotations;

namespace StudentManagementApi.Models.DTOs
{
    public class SubjectDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int StudentCount { get; set; }
    }

    public class CreateSubjectDto
    {
        [Required(ErrorMessage = "Name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be 2-100 characters.")]
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateSubjectDto
    {
        [Required(ErrorMessage = "Name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be 2-100 characters.")]
        public string Name { get; set; } = string.Empty;
    }
}
