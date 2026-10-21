namespace StudentManagementApi.Models.DTOs
{
    /// <summary>
    /// Safe projection of an account. Password, password hash and security
    /// stamp are deliberately excluded.
    /// </summary>
    public class AppUserDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
