const FieldsLocale = {
    th:{
        sport_name: 'name',
        facility_name: 'name',
        province_name: 'name_th',
        district_name: 'name_th',
        custom_text: 'text',
        provider_name: 'fullname',
        court_name: 'name',
        court_type_name: 'name',
        service_name: 'name',
        chat_topic: 'แมทช์หาเพื่อนเล่น',
        prompt_pay: 'พร้อมเพย์',
        credit_card: 'บัตรเครดิต',
        urgent_update_type: 'ย้ายแมทช์ฉุกเฉิน'
    },
    en:{
        sport_name: 'name_en',
        facility_name: 'name2',
        province_name: 'name_en',
        district_name: 'name_en',
        custom_text: 'text_en',
        provider_name: 'fullname_en',
        court_name: 'name_en',
        court_type_name: 'name_en',
        service_name: 'name_en',
        chat_topic: 'Public match',
        prompt_pay: 'Prompt Pay',
        credit_card: 'Credit Card',
        urgent_update_type: 'Urgent Match Update'
    },
    translate(lang, obj, field){
        if(obj) return obj[FieldsLocale[lang][field]] ? obj[FieldsLocale[lang][field]]: obj[FieldsLocale['th'][field]]
        else return ''
    },
    translateMatch(lang, match){
        match.court.name = this.translate(lang, match.court, 'court_name')
        match.court.court_type.name = this.translate(lang, match.court.court_type, 'court_type_name')

        const provider_sport = match.court.court_type.provider_sport
        match.court.court_type.provider_sport.provider.location = provider_sport.provider.address? `${FieldsLocale.translate(lang, provider_sport.provider.address.district,'district_name')}, ${FieldsLocale.translate(lang, provider_sport.provider.address.province,'province_name')}`:''
        match.court.court_type.provider_sport.sport.name = this.translate(lang, provider_sport.sport,'sport_name')
        match.court.court_type.provider_sport.provider.fullname =  this.translate(lang, provider_sport.provider,'provider_name')
        return match
    },
    translateProviderSport(lang, provider_sport){
        provider_sport.sport.name = this.translate(lang, provider_sport.sport,'sport_name')
        provider_sport.court_types.map(ct=>{
            ct.name = this.translate(lang, ct,'court_type_name')
            ct.courts.map(c=>{
                c.name = this.translate(lang, c,'court_name')
            })
            return ct
        })
        return provider_sport
    },
    translateMatchType(lang, field){
        return FieldsLocale[lang][field] ? FieldsLocale[lang][field] : FieldsLocale['th'][field]
    }
}
module.exports = FieldsLocale