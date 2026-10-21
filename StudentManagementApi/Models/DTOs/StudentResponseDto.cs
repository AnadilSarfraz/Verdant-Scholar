namespace StudentManagementApi.Models.DTOs
{
    public class StudentResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Email { get; set; } = string.Empty;

        // Additive fields — the four properties above are unchanged.
        public int DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public List<SubjectDto> Subjects { get; set; } = new();
    }
}
