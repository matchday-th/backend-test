'Defined by FrontEnd'

/* As ID = 1 */

const ArenaEndpoint = {
    id: 1,
    Token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTYyMTQwNjQ2MH0.zGb0txix8j7H1QHs8_zM0X2J0L1NpiAXXSGEkEh46R8',
    getProfile: {
        "id": 1,
        "phone_number": "admin",
        "email": "booking.matchday@gmail.com",
        "logo": "https://res.cloudinary.com/dzo9w0rbd/image/upload/v1610080345/Project%20-%20Landing%20Page/Picture%20Logo%20SP/1.Badminton/S__5095428_in55bk.jpg",
        "location": "testEdit Profile",
        "minTime": "06:00",
        "maxTime": "27:00",
        "online_pay": 1,
        "deposit_pay": 50,
        "fullname": "Matchday Arena",
        "provider_sports": [
            {
                "id": 1,
                "provider_id": 1,
                "sport_id": 1,
                "calendar_view": "Timeline",
                "sport": {
                    "id": 1,
                    "name": "ฟุตบอล",
                    "icon": "https://res.cloudinary.com/matchday-hub/image/upload/v1589731881/Icon%20Sport/Final/Football_iqo75t.png",
                    "marker": "https://res.cloudinary.com/matchday-hub/image/upload/v1590162735/Icon%20Sport/home%20page/Football_ezexcd.png",
                    "photo_url": null,
                    "available": 1,
                    "sizing": 0
                },
                "court_types": [
                    {
                        "id": 1,
                        "provider_sport_id": 1,
                        "name": "Ball Type 1",
                        "type": "Outdoor",
                        "ground_type": "Glass",
                        "sharing": 0,
                        "detail": "admin",
                        "coupon": 0,
                        "max_team_size": 10,
                        "image": "admin",
                        "price": 0,
                        "courts": [
                            {
                                "id": 1,
                                "court_type_id": 1,
                                "price": 1,
                                "image": "https://res.cloudinary.com/matchday-hub/image/upload/v1590913240/1.RJ%20Badminton/4_q2drck.jpg",
                                "name": "Grass 1"
                            },
                            {
                                "id": 2,
                                "court_type_id": 1,
                                "price": 1,
                                "image": null,
                                "name": "Grass 2"
                            }
                        ],
                        "time_slots": [
                            {
                                "id": 1,
                                "court_type_id": 1,
                                "days": "1,2,3,4,5",
                                "open_time": "6:00",
                                "close_time": "26:00",
                                "slot_prices": [
                                    {
                                        "id": 1,
                                        "time_slot_id": 1,
                                        "start_time": "12:00",
                                        "end_time": "14:00",
                                        "var_price": 100,
                                        "percent": 0
                                    },
                                    {
                                        "id": 2,
                                        "time_slot_id": 1,
                                        "start_time": "9:00",
                                        "end_time": "10:00",
                                        "var_price": -50,
                                        "percent": 0
                                    }
                                ]
                            },
                            {
                                "id": 2,
                                "court_type_id": 1,
                                "days": "0,6",
                                "open_time": "8:00",
                                "close_time": "27:00",
                                "slot_prices": [
                                    {
                                        "id": 3,
                                        "time_slot_id": 2,
                                        "start_time": "11:00",
                                        "end_time": "15:00",
                                        "var_price": 200,
                                        "percent": 0
                                    }
                                ]
                            }
                        ],
                        "period_price": [
                            {
                                "id": 1,
                                "provider_sport_id": 1,
                                "start_time": "12:00",
                                "end_time": "14:00",
                                "var_type": 0,
                                "var_price": 1,
                                "days": "0,1,2,3,4,5,6",
                                "pivot": {
                                    "period_price_id": 1,
                                    "court_type_id": 1
                                }
                            }
                        ]
                    },
                    {
                        "id": 2,
                        "provider_sport_id": 1,
                        "name": "Ball Type 2",
                        "type": "Outdoor",
                        "ground_type": "Glass",
                        "sharing": 0,
                        "detail": "admin",
                        "coupon": 0,
                        "max_team_size": 10,
                        "image": "admin",
                        "price": 0,
                        "courts": [
                            {
                                "id": 3,
                                "court_type_id": 2,
                                "price": 3,
                                "image": null,
                                "name": "Ar-Grass 1"
                            }
                        ],
                        "time_slots": [],
                        "period_price": [
                            {
                                "id": 2,
                                "provider_sport_id": 2,
                                "start_time": "18:00",
                                "end_time": "20:00",
                                "var_type": 1,
                                "var_price": 2,
                                "days": "0,1,2,3,4,5,6",
                                "pivot": {
                                    "period_price_id": 2,
                                    "court_type_id": 2
                                }
                            }
                        ]
                    }
                ],
                "bus_times": [
                    {
                        "id": 1,
                        "provider_sport_id": 1,
                        "days": "1,2,3,4,5",
                        "open_time": "6:00",
                        "close_time": "26:00"
                    },
                    {
                        "id": 2,
                        "provider_sport_id": 1,
                        "days": "0,6",
                        "open_time": "8:00",
                        "close_time": "27:00"
                    }
                ]
            },
            {
                "id": 2,
                "provider_id": 1,
                "sport_id": 9,
                "calendar_view": "List",
                "sport": {
                    "id": 9,
                    "name": "ธนู(แบบกลุ่ม)",
                    "icon": "https://res.cloudinary.com/matchday-hub/image/upload/v1599221516/Icon%20Sport/Final/Artboard_1_fus8db.png",
                    "marker": "https://res.cloudinary.com/matchday-hub/image/upload/v1599220355/Icon%20Sport/home%20page/Ac-Ar_qafvma.png",
                    "photo_url": null,
                    "available": 1,
                    "sizing": 0
                },
                "court_types": [
                    {
                        "id": 4,
                        "provider_sport_id": 2,
                        "name": "List",
                        "type": "Outdoor",
                        "ground_type": "Glass",
                        "sharing": 0,
                        "detail": "admin",
                        "coupon": 0,
                        "max_team_size": 10,
                        "image": "admin",
                        "price": 0,
                        "courts": [
                            {
                                "id": 5,
                                "court_type_id": 4,
                                "price": 2,
                                "image": null,
                                "name": "Coupon List"
                            }
                        ],
                        "time_slots": [],
                        "period_price": []
                    }
                ],
                "bus_times": [
                    {
                        "id": 3,
                        "provider_sport_id": 2,
                        "days": "0,1,2,3,4,5,6",
                        "open_time": "10:00",
                        "close_time": "22:00"
                    }
                ]
            },
            {
                "id": 3,
                "provider_id": 1,
                "sport_id": 2,
                "calendar_view": "Timeline",
                "sport": {
                    "id": 2,
                    "name": "บาสเกตบอล",
                    "icon": "https://res.cloudinary.com/matchday-hub/image/upload/v1589731879/Icon%20Sport/Final/Basketball_l2ls6b.png",
                    "marker": "https://res.cloudinary.com/matchday-hub/image/upload/v1590162911/Icon%20Sport/home%20page/Basketball_urtvwl.png",
                    "photo_url": null,
                    "available": 1,
                    "sizing": 0
                },
                "court_types": [
                    {
                        "id": 3,
                        "provider_sport_id": 3,
                        "name": "Bas Type 1",
                        "type": "Outdoor",
                        "ground_type": "Glass",
                        "sharing": 0,
                        "detail": "admin",
                        "coupon": 0,
                        "max_team_size": 10,
                        "image": "admin",
                        "price": 0,
                        "courts": [
                            {
                                "id": 4,
                                "court_type_id": 3,
                                "price": 1,
                                "image": null,
                                "name": "Bas 1"
                            }
                        ],
                        "time_slots": [],
                        "period_price": []
                    }
                ],
                "bus_times": [
                    {
                        "id": 110,
                        "provider_sport_id": 3,
                        "days": "0,1,3,5,6",
                        "open_time": "8:00",
                        "close_time": "23:00"
                    }
                ]
            },
            {
                "id": 69,
                "provider_id": 1,
                "sport_id": 3,
                "calendar_view": null,
                "sport": {
                    "id": 3,
                    "name": "แบดมินตัน",
                    "icon": "https://res.cloudinary.com/matchday-hub/image/upload/v1589731879/Icon%20Sport/Final/Badminton_gduzsj.png",
                    "marker": "https://res.cloudinary.com/matchday-hub/image/upload/v1590162910/Icon%20Sport/home%20page/Badminton_hl6zvh.png",
                    "photo_url": null,
                    "available": 1,
                    "sizing": 0
                },
                "court_types": [
                    {
                        "id": 83,
                        "provider_sport_id": 69,
                        "name": "สนามโดม",
                        "type": "ในร่ม",
                        "ground_type": null,
                        "sharing": 0,
                        "detail": null,
                        "coupon": 0,
                        "max_team_size": null,
                        "image": null,
                        "price": 300,
                        "courts": [
                            {
                                "id": 410,
                                "court_type_id": 83,
                                "price": null,
                                "image": null,
                                "name": "ช่อง A"
                            },
                            {
                                "id": 411,
                                "court_type_id": 83,
                                "price": null,
                                "image": null,
                                "name": "ช่อง B"
                            },
                            {
                                "id": 412,
                                "court_type_id": 83,
                                "price": null,
                                "image": null,
                                "name": "ช่อง C"
                            },
                            {
                                "id": 413,
                                "court_type_id": 83,
                                "price": null,
                                "image": null,
                                "name": "ช่อง D"
                            },
                            {
                                "id": 414,
                                "court_type_id": 83,
                                "price": null,
                                "image": null,
                                "name": "ช่อง E"
                            }
                        ],
                        "time_slots": [
                            {
                                "id": 15,
                                "court_type_id": 83,
                                "days": "0,1,4,5",
                                "open_time": "8:00",
                                "close_time": "20:00",
                                "slot_prices": []
                            },
                            {
                                "id": 16,
                                "court_type_id": 83,
                                "days": "2,3,6",
                                "open_time": "10:00",
                                "close_time": "22:00",
                                "slot_prices": []
                            }
                        ],
                        "period_price": []
                    }
                ],
                "bus_times": []
            },
            {
                "id": 71,
                "provider_id": 1,
                "sport_id": 4,
                "calendar_view": null,
                "sport": {
                    "id": 4,
                    "name": "ปิงปอง",
                    "icon": "https://res.cloudinary.com/matchday-hub/image/upload/v1589731883/Icon%20Sport/Final/TableTennis_hacuhv.png",
                    "marker": "https://res.cloudinary.com/matchday-hub/image/upload/v1590162910/Icon%20Sport/home%20page/Tabletennis_prhugv.png",
                    "photo_url": null,
                    "available": 1,
                    "sizing": 0
                },
                "court_types": [
                    {
                        "id": 85,
                        "provider_sport_id": 71,
                        "name": "สนามโดม",
                        "type": "ในร่ม",
                        "ground_type": null,
                        "sharing": 0,
                        "detail": null,
                        "coupon": 0,
                        "max_team_size": null,
                        "image": null,
                        "price": 300,
                        "courts": [
                            {
                                "id": 420,
                                "court_type_id": 85,
                                "price": null,
                                "image": null,
                                "name": "ช่อง A"
                            },
                            {
                                "id": 421,
                                "court_type_id": 85,
                                "price": null,
                                "image": null,
                                "name": "ช่อง B"
                            },
                            {
                                "id": 422,
                                "court_type_id": 85,
                                "price": null,
                                "image": null,
                                "name": "ช่อง C"
                            },
                            {
                                "id": 423,
                                "court_type_id": 85,
                                "price": null,
                                "image": null,
                                "name": "ช่อง D"
                            },
                            {
                                "id": 424,
                                "court_type_id": 85,
                                "price": null,
                                "image": null,
                                "name": "ช่อง E"
                            }
                        ],
                        "time_slots": [
                            {
                                "id": 19,
                                "court_type_id": 85,
                                "days": "0,1,4,5",
                                "open_time": "8:00",
                                "close_time": "20:00",
                                "slot_prices": []
                            },
                            {
                                "id": 20,
                                "court_type_id": 85,
                                "days": "2,3,6",
                                "open_time": "10:00",
                                "close_time": "22:00",
                                "slot_prices": []
                            }
                        ],
                        "period_price": []
                    },
                    {
                        "id": 86,
                        "provider_sport_id": 71,
                        "name": "สนามโดม",
                        "type": "นอกร่ม",
                        "ground_type": null,
                        "sharing": 0,
                        "detail": null,
                        "coupon": 0,
                        "max_team_size": null,
                        "image": null,
                        "price": 300,
                        "courts": [
                            {
                                "id": 425,
                                "court_type_id": 86,
                                "price": null,
                                "image": null,
                                "name": "ช่อง A"
                            },
                            {
                                "id": 426,
                                "court_type_id": 86,
                                "price": null,
                                "image": null,
                                "name": "ช่อง B"
                            }
                        ],
                        "time_slots": [
                            {
                                "id": 21,
                                "court_type_id": 86,
                                "days": "0,1,4,5",
                                "open_time": "8:00",
                                "close_time": "20:00",
                                "slot_prices": []
                            },
                            {
                                "id": 22,
                                "court_type_id": 86,
                                "days": "2,3,6",
                                "open_time": "10:00",
                                "close_time": "22:00",
                                "slot_prices": []
                            }
                        ],
                        "period_price": []
                    }
                ],
                "bus_times": []
            }
        ],
        "bus_times": [
            {
                "id": 1,
                "provider_sport_id": 1,
                "days": "1,2,3,4,5",
                "open_time": "6:00",
                "close_time": "26:00",
                "__meta__": {
                    "through_provider_id": 1
                }
            },
            {
                "id": 2,
                "provider_sport_id": 1,
                "days": "0,6",
                "open_time": "8:00",
                "close_time": "27:00",
                "__meta__": {
                    "through_provider_id": 1
                }
            },
            {
                "id": 3,
                "provider_sport_id": 2,
                "days": "0,1,2,3,4,5,6",
                "open_time": "10:00",
                "close_time": "22:00",
                "__meta__": {
                    "through_provider_id": 1
                }
            },
            {
                "id": 110,
                "provider_sport_id": 3,
                "days": "0,1,3,5,6",
                "open_time": "8:00",
                "close_time": "23:00",
                "__meta__": {
                    "through_provider_id": 1
                }
            }
        ],
        "packages": [],
        "services": [
            {
                "id": 1,
                "provider_sport_id": 1,
                "name": "กรรมการ",
                "price": "800",
                "icon": null,
                "__meta__": {
                    "through_provider_id": 1
                }
            },
            {
                "id": 2,
                "provider_sport_id": 2,
                "name": "Rent Bow",
                "price": "400",
                "icon": null,
                "__meta__": {
                    "through_provider_id": 1
                }
            },
            {
                "id": 4,
                "provider_sport_id": 1,
                "name": "test",
                "price": "200",
                "icon": null,
                "__meta__": {
                    "through_provider_id": 1
                }
            },
            {
                "id": 5,
                "provider_sport_id": 1,
                "name": "test2",
                "price": "300",
                "icon": null,
                "__meta__": {
                    "through_provider_id": 1
                }
            }
        ],
        "stocks": []
    },
    updateProfile: function updateProfile(providerInstance) {
        return { status: 'success', updated: providerInstance }
    }
}

module.exports = ArenaEndpoint