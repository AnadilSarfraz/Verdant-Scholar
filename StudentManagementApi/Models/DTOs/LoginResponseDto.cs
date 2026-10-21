namespace StudentManagementApi.Models.DTOs
{
    /// <summary>
    /// Successful login response. Contains only the signed JWT and safe
    /// profile fields - never the password or the password hash.
    /// </summary>
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
        public AppUserDto User { get; set; } = new();
    }
}
