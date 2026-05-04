using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrkaEval.Api.Migrations.PG
{
    /// <inheritdoc />
    public partial class SyncSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Coaches",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Candidates",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Coaches");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Candidates");
        }
    }
}
