using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentManagementApi.Data;
using StudentManagementApi.Models;

// Controlled, single-use setup: creates one Admin account.
// After running, the role exists. If Admin username already exists,
// the script exits without overwriting.

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=StudentManagementDB;Integrated Security=True;TrustServerCertificate=True;");
});
builder.Services.AddIdentity<AppUser, AppRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>();

var serviceProvider = builder.Services.BuildServiceProvider();
using var scope = serviceProvider.CreateScope();

var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();

// Ensure Admin role exists (idempotent)
if (await roleManager.FindByNameAsync("Admin") == null)
    await roleManager.CreateAsync(new AppRole("Admin"));

var adminEmail = Environment.GetEnvironmentVariable("SETUP_ADMIN_EMAIL") ?? "admin@verdant.scholar";
var adminPassword = Environment.GetEnvironmentVariable("SETUP_ADMIN_PASSWORD");

if (string.IsNullOrWhiteSpace(adminPassword))
{
    Console.WriteLine("ERROR: SETUP_ADMIN_PASSWORD environment variable is required.");
    Console.WriteLine("Run: SET SETUP_ADMIN_PASSWORD=YourSecurePassword123! && dotnet run");
    return 1;
}

var existing = await userManager.FindByEmailAsync(adminEmail);
if (existing != null)
{
    Console.WriteLine($"Admin already exists (Id={existing.Id}). No changes made.");
    return 0;
}

var user = new AppUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true };
var result = await userManager.CreateAsync(user, adminPassword);
if (!result.Succeeded)
{
    Console.WriteLine("Failed to create admin: " + string.Join(", ", result.Errors.Select(e => e.Description)));
    return 1;
}

await userManager.AddToRoleAsync(user, "Admin");
Console.WriteLine($"Admin created: {adminEmail} (Id={user.Id}, Role=Admin).");
Console.WriteLine("IMPORTANT: Change the password after first login.");
return 0;
