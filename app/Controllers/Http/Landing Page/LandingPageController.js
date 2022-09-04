"use strict";

const Provider = use("App/Models/Provider");
const Address = use("App/Models/Address");
const Sport = use("App/Models/Sport");
const Rating = use("App/Models/Rating");
const CourtType = use("App/Models/CourtType");
const ProviderReview = use("App/Models/ProviderReview")
const moment = use("moment");

// const Redis = require("ioredis");
// const redis = new Redis({
//   port: 6379, // Redis port
//   host: "127.0.0.1", // Redis host
//   family: 4, // 4 (IPv4) or 6 (IPv6)
//   db: 0,
// });
class LandingPageController {
  // Example of database cache using
  // async index({ response }) {
  //   const cachedProviders = await redis.get('providers3')
  //   if(cachedProviders) {
  //     console.log("get cache")
  //     return response.send(JSON.parse(cachedProviders));
  //   }

  //   const provider = await Provider.query()
  //     .whereNot("hidden_page", 1)
  //     .with("provider_sports", (bd) => {
  //       bd.with("sport");
  //       bd.with("court_types.courts");
  //     })
  //     .with("facilities")
  //     .with("photos")
  //     .with("bus_times")
  //     .with("address")
  //     .with("ratings")
  //     .fetch();

  //   await redis.set("providers3", JSON.stringify(provider));
  //   console.log("set cache")

  //   return response.send(provider);
  // }

  async index({ response }) {
    const provider = await Provider.query()
      .whereNot("hidden_page", 1)
      .with("provider_sports", (bd) => {
        bd.with("sport");
        bd.with("court_types.courts");
      })
      .with("facilities")
      .with("photos")
      .with("bus_times")
      .with("address")
      .with("ratings")
      .fetch();

    return response.send(provider);
  }

  async getProvider({ response, params }) {
    const provider = await Provider.query()
      .where("id", params.id)
      .whereNot("hidden_page", 1)
      .with("provider_sports", (bd) => {
        bd.with("sport");
        bd.with("court_types.courts");
      })
      .with("facilities")
      .with("photos")
      .with("bus_times")
      .with("address")
      .with("ratings", (rating) => {
        rating.whereNotNull("comment");
        rating.whereHas("user");
        rating.with("user");
      })
      .with("services")
      .fetch();

    return response.send(provider);
  }

  async createAddress({ response, request, params }) {
    //TODO record new address

    /* request body example 
        {
            "name" : "test",
            "number" : 99,
            "alley" : "sukhumvit",
            "road" : "sukhumvit",
            "subdistrict" : "sukhumvit",
            "district" : "sukhumvit",
            "province" : "bangkok",
            "postcode" : 12120,
            "country" : "thailand"
        } */

    /* Create new record */
    request.body.provider_id = params.sp_id;
    const record = await Address.create(request.body);

    /* Update Record */
    // const id = 1 /* Address ID */
    // const record = await Address.find(id)
    //     record.merge(request.body)
    //     await record.save()

    return response.send(record);
  }

  async nearbyProvider({ response, request }) {
    const query_params = request.get();
    const lat = query_params.lat;
    const lng = query_params.lng;

    const providers_query = await Provider.query()
      .whereNot("hidden_page", 1)
      .with("photos")
      .with("ratings")
      .with("address")
      .with("court_types", (ct) => {
        ct.with("provider_sport.sport");
      })
      .with("provider_sports.sport")
      .fetch();

    let distance = 0;
    const providers = providers_query.toJSON();

    let results = await providers.map((provider) => {
      if (provider.available !== 1) {
        return;
      }

      distance = this.getDistanceFromLatLngInKm(
        lat,
        lng,
        provider.lat,
        provider.lng
      );
      if (distance > 3) {
        return;
      }

      // TODO Film: share component (average score)
      let num_ratings = 0;
      let all_scores = 0;
      let avg_scores = 0;

      provider.ratings.map((rating) => {
        all_scores += rating.score;
        num_ratings++;
      });

      if (num_ratings !== 0) {
        avg_scores = Math.round(all_scores / num_ratings);
      }

      let address = provider.address;

      if (address === undefined || address == null) {
        address = null;
      } else {
        address = {
          number: address.number,
          alley: address.alley,
          road: address.road,
          subdistrict: address.subdistrict,
          district: address.district,
          province: address.province,
          postcode: address.postcode,
          country: address.country,
        };
      }

      let data = {
        provider_id: provider.id,
        provider_name: provider.fullname,
        phone_number: provider.phone_number,
        available: provider.available,
        full_address: provider.location,
        address: address,
        distance: distance,
        stars: avg_scores,
        logo: provider.logo,
        cover: provider.photos[0] == undefined ? "" : provider.photos[0].image,
        court_types: provider.court_types,
        sports: provider.provider_sports,
      };

      return data;
    });

    results = results.filter((result) => !!result); // remove null
    let results_size = results.length;
    if (results_size >= 5) {
      return response.send(results);
    }
    // --------------------------------------------------------------------

    // If there is no any sport provider near by, the default will be fixed
    // default sport provider is in order below
    let default_provider_ids = [
      2, 4, 87, 94, 90, 91, 93, 96, 98, 129, 133, 134, 135, 143, 144, 110, 13,
      11, 12, 92,
    ];

    if (results_size > 0 && results_size < 5) {
      let extra_result = 5 - results_size;
      default_provider_ids = default_provider_ids.slice(0, extra_result);
    }

    // TODO: should new way to do this logic because it takes O(2)
    const default_results = default_provider_ids.map((default_provider_id) => {
      let selected_provider = providers.find(
        (provider) => provider.id === default_provider_id
      );

      if (selected_provider === undefined) {
        return;
      }

      if (selected_provider.available !== 1) {
        return;
      }

      let num_ratings = 0;
      let all_scores = 0;
      let avg_scores = 0;

      selected_provider.ratings.map((rating) => {
        all_scores += rating.score;
        num_ratings++;
      });

      if (num_ratings !== 0) {
        avg_scores = Math.round(all_scores / num_ratings);
      }

      let address = selected_provider.address;

      if (address === undefined || address == null) {
        address = null;
      } else {
        address = {
          number: address.number,
          alley: address.alley,
          road: address.road,
          subdistrict: address.subdistrict,
          district: address.district,
          province: address.province,
          postcode: address.postcode,
          country: address.country,
        };
      }

      distance = this.getDistanceFromLatLngInKm(
        lat,
        lng,
        selected_provider.lat,
        selected_provider.lng
      );

      let data = {
        provider_id: selected_provider.id,
        provider_name: selected_provider.fullname,
        phone_number: selected_provider.phone_number,
        available: selected_provider.available,
        address: selected_provider.location,
        full_address: selected_provider.location,
        address: address,
        distance: distance,
        stars: avg_scores,
        logo: selected_provider.logo,
        cover:
          selected_provider.photos[0] == undefined
            ? ""
            : selected_provider.photos[0].image,
        court_types: selected_provider.court_types,
      };

      return data;
    });
    return response.send(default_results.filter((result) => !!result)); // remove null
  }

  async recommendedSport({ response, request }) {
    const sports_query = await Sport.query().with("provider_sports").fetch();

    const sports = sports_query.toJSON();

    const results = sports.map((sport) => {
      let data = {
        sport_id: sport.id,
        sport_name: sport.name,
        sport_icon: sport.icon,
        sport_maker: sport.marker,
        sport_photo: sport.photo_url,
        number_of_providers: sport.provider_sports.length,
      };

      return data;
    });

    return response.send(
      results.sort((a, b) => b.number_of_providers - a.number_of_providers)
    );
  }

  async allLocation({ response, request }) {
    let addressesQuery = await Address
                          .query()
                          .distinct('province', 'district')
                          .orderBy('province', 'asc')
                          .fetch();

    let result = [];
    let districtList = ["ทั้งหมด"];
    let addresses = addressesQuery.toJSON();
    let addressesLength = addresses.length;

    addresses.forEach(function (address, index) {
      // First
      if(index <= 0) {
        return
      }

      let prevAddress = addresses[index - 1];
      districtList.push(prevAddress.district);

      if(prevAddress.province != address.province) {
        result.push(
          {
            "province": prevAddress.province,
            "district": districtList
          }
        )
        // reset all districts of prevAddress's province
        districtList = ["ทั้งหมด"];
      }
      

      // Last
      if(addressesLength - 1 == index) {
        districtList.push(address.district)
        result.push(
          {
            "province": address.province,
            "district": districtList
          }
        )
      }
    })
    return response.send(result);
  }

  async searchProvider({ response, request }) {
    // const cachedSearchProviders = await redis.get('searchproviders')
    // if(cachedSearchProviders) {
    //   console.log('get cache')
    //   return response.send(JSON.parse(cachedSearchProviders))
    // }

    let results = {};
    let { search_request } = request.body;

    if (search_request === undefined || search_request == null) {
      return response.send(results);
    }

    let { keyword, sport_ids, location, time_start, time_end } = search_request;
    let lat = location.lat;
    let lng = location.lng;

    let providers_query = await Provider.query()
      .whereNot("hidden_page", 1)
      .where(function () {
        if (lat != 0 && lng != 0) {

        } else {
          this.where("fullname", "LIKE", `%${keyword}%`);
          this.orWhere("location", "LIKE", `%${keyword}%`);
        }
      })
      .whereHas("provider_sports", (ps) => {
        ps.whereHas("sport", (s) => {
          s.whereIn("id", sport_ids);
        });
      })
      .with("facilities")
      .with("ratings")
      .with("photos")
      .with("address")
      .with("court_types")
      .whereDoesntHave('matches', (match) => {
        match.where('cancel', 0)
        match.where(function() {
          this.whereBetween('time_start', [time_start, time_end])
          this.orWhereBetween('time_end', [time_start, time_end])
          this.orWhere(function () {
            this.where('time_start', '<=', time_start)
            this.where('time_start', '<=', time_end)
            this.where('time_end', '>=', time_start)
            this.where('time_end', '>=', time_end)
          })
        })
      })
      .fetch();

    let distance = 0;
    const providers = await providers_query.toJSON();

    results.results = providers.map((provider) => {
      if (lat != 0 && lng != 0) {
        distance = this.getDistanceFromLatLngInKm(
          lat,
          lng,
          provider.lat,
          provider.lng
        );
        if (distance > 3) {
          return;
        }
      }

      const facilities = provider.facilities.map((facility) => {
        return facility.name;
      });

      // TODO Film: share component (average score)
      let num_ratings = 0;
      let all_scores = 0;
      let avg_scores = 0;
      provider.ratings.map((rating) => {
        all_scores += rating.score;
        num_ratings++;
      });

      if (num_ratings !== 0) {
        avg_scores = Math.round(all_scores / num_ratings);
      }

      let address = provider.address;

      if (address === undefined || address == null) {
        address = null;
      } else {
        address = {
          number: address.number,
          alley: address.alley,
          road: address.road,
          subdistrict: address.subdistrict,
          district: address.district,
          province: address.province,
          postcode: address.postcode,
          country: address.country,
        };
      }

      let data = {
        provider_id: provider.id,
        provider_name: provider.fullname,
        available: provider.available,
        phone_number: provider.phone_number,
        full_address: provider.location,
        address: address,
        location: {
          lat: provider.lat,
          lng: provider.lng,
        },
        online_pay: provider.online_pay,
        facilities: facilities,
        stars: avg_scores,
        number_of_reviews: num_ratings,
        image: provider.logo,
        cover: provider.photos[0] == undefined ? "" : provider.photos[0].image,
        court_types: provider.court_types,
      };
      return data;
    });

    const ascending = results.results.filter((result) => !!result).sort((a, b) => b["available"] - a["available"]);
    results.results = ascending
    results.count = ascending.length;

    // await redis.set('searchproviders', JSON.stringify(results))
    
    return response.send(results);
  }

  async getProviderReviews( {response, request }) {
    const provider_reviews = await ProviderReview.all()
    return response.send(provider_reviews)
  }

  async reviewProvider({ response, request }) {
    const reviews_query = await Rating
      .query()
      .whereHas('user')
      .with("user")
      .whereHas('provider')
      .with("provider")
      .with("provider", (provider) => {
        provider.with("photos");
        provider.with("provider_sports", (provider_sport) => {
          provider_sport.with("sport");
        });
      })
      .fetch();

    const reviews = reviews_query.toJSON().filter(({ user }) => user).sort(() => Math.random() - 0.5); // random results in list
    const results = reviews.slice(0, 20).map((review) => {
      let sport =
        review.provider.provider_sports[0] === undefined
          ? null
          : review.provider.provider_sports[0].sport === undefined
          ? null
          : review.provider.provider_sports[0].sport;
      let data = {
        user_id: review.user.id,
        user_fullname: review.user.fullname,
        user_profile_pic: review.user.avatar,
        provider_id: review.provider.id,
        provider_name: review.provider.fullname,
        provider_logo: review.provider.logo,
        provider_cover:
          review.provider.photos[0] === undefined
            ? ""
            : review.provider.photos[0].image,
        sport_id: sport == null ? 0 : sport.id,
        sport_name: sport == null ? "" : sport.name,
        review_comment: review.comment,
        review_rating: review.score,
      };
      return data;
    });

    return response.send(results);
  }

  // Ref: https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
  getDistanceFromLatLngInKm(lat1, lng1, lat2, lng2) {
    let R = 6371; // Radius of the earth in km
    let dLat = this.deg2rad(lat2 - lat1); // deg2rad below
    let dLng = this.deg2rad(lng2 - lng1);
    let a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c; // Distance in km

    return Math.round((d + Number.EPSILON) * 100) / 100;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}

module.exports = LandingPageController;

// TODO: share function coz there are the same in ProviderController (below functions)
// To query Provider by ID
async function getProvider(id) {
  return Provider.find(id);
}

// To query court type by ID
async function getCourtType(id) {
  return CourtType.find(id);
}

async function getFreeCourt(
  provider_id,
  court_types_ids,
  time_start,
  time_end
) {
  let provider = await getProvider(provider_id);

  // TODO: modify
  let day = moment(time_start, "YYYY-MM-DD HH:mm").format("e");

  let com_start = moment(time_start, "YYYY-MM-DD HH:mm").unix();
  let com_end = moment(time_end, "YYYY-MM-DD HH:mm").unix();
  if (com_start > com_end) {
    time_end = moment(time_end, "YYYY-MM-DD HH:mm")
      .add(1, "days")
      .format("YYYY-MM-DD HH:mm");
  } //check TimeEnd Day

  let pas_start = moment(time_start, "YYYY-MM-DD HH:mm")
    .add(1, "minutes")
    .format("YYYY-MM-DD HH:mm");

  if (parseInt(provider.maxTime, 10) > 23) {
    provider.maxTime = `${parseInt(provider.maxTime, 10) - 24}:00`;
  }

  let pas_end = moment(
    `
                ${moment(time_end, "YYYY-MM-DD HH:mm")
                  .startOf("day")
                  .format("YYYY-MM-DD")} 
                ${provider.maxTime}`,
    "YYYY-MM-DD HH:mm"
  ).format("YYYY-MM-DD HH:mm");

  let checkMin = moment(pas_start, "YYYY-MM-DD HH:mm").format("HH:mm");
  let checkMax = moment(pas_end, "YYYY-MM-DD HH:mm").format("HH:mm");
  if (parseInt(checkMax, 10) < parseInt(checkMin, 10)) {
    pas_end = moment(pas_end, "YYYY-MM-DD HH:mm")
      .add(1, "days")
      .format("YYYY-MM-DD HH:mm");
  }

  if (parseInt(checkMin, 10) < 4) {
    day = day - 1;
    if (day < 0) {
      day = 6;
    }
  }

  // =====================================================================================================================

  if (court_types_ids === undefined || court_types_ids == null) {
    return { free: null };
  }

  let court_type_id = -1;
  let court_type = null;
  let queryFreeCourt = null;
  let free_court = [];

  for (var i = 0; i < court_types_ids.length; i++) {
    court_type_id = court_types_ids[i];
    court_type = await getCourtType(court_type_id);

    queryFreeCourt = await court_type
      .courts()
      .whereDoesntHave("matches", (match) => {
        match.where("cancel", 0);
        match.where(function () {
          this.whereBetween("time_start", [pas_start, time_end]);
          this.orWhereBetween("time_end", [pas_start, time_end]);
          this.orWhere(function () {
            this.where("time_start", "<=", pas_start);
            this.where("time_start", "<=", time_end);
            this.where("time_end", ">=", pas_start);
            this.where("time_end", ">=", time_end);
          });
        });
      })
      .fetch();

    free_court.push({
      provider_id: provider_id,
      court_type_id: court_type_id,
      courts: queryFreeCourt,
    });
  }

  // =====================================================================================================================

  return {
    free: free_court,
  };
}