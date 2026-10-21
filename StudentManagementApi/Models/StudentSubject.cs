namespace StudentManagementApi.Models
{
    public class StudentSubject
    {
        public int StudentId { get; set; }
        public Student Student { get; set; } = null!;

        public int SubjectId { get; set; }
        public Subject Subject { get; set; } = null!;
    }
}