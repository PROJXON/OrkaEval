using AutoMapper;
using OrkaEval.Api.Models;
using OrkaEval.Api.Models.DTOs;

namespace OrkaEval.Api.Profiles;

public class EvaluationProfile : Profile
{
    public EvaluationProfile()
    {
        // User → UserDto
        CreateMap<User, UserDto>()
            .ForMember(d => d.Role, o => o.MapFrom(s => s.Role.ToString()));

        // Evaluation → EvaluationDto (read)
        CreateMap<Evaluation, EvaluationDto>()
            .ForMember(d => d.CycleNumber, o => o.MapFrom(s => s.Cycle != null ? s.Cycle.Number : 0));

        // EvaluationCreateDto → Evaluation (self-save, upsert)
        CreateMap<EvaluationCreateDto, Evaluation>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));
    }
}
