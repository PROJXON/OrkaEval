using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrkaEval.Api.Migrations.PG
{
    /// <inheritdoc />
    public partial class AddFormSubmissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FormSubmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CoachId = table.Column<int>(type: "INTEGER", nullable: false),
                    CandidateId = table.Column<int>(type: "INTEGER", nullable: false),
                    FormType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FormData = table.Column<string>(type: "TEXT", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CycleId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormSubmissions_Candidates_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "Candidates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FormSubmissions_Coaches_CoachId",
                        column: x => x.CoachId,
                        principalTable: "Coaches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FormSubmissions_CandidateId",
                table: "FormSubmissions",
                column: "CandidateId");

            migrationBuilder.CreateIndex(
                name: "IX_FormSubmissions_CoachId",
                table: "FormSubmissions",
                column: "CoachId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FormSubmissions");
        }
    }
}
