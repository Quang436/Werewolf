using System;
using System.Collections.Generic;
using UnityEngine;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;

namespace Werewolf.Network
{
    /// <summary>
    /// SocketNetworkManager: Quản trị kết nối Realtime giữa Unity Client và Node.js Server (apps/server).
    /// </summary>
    public class SocketNetworkManager : MonoBehaviour
    {
        public static SocketNetworkManager Instance { get; private set; }

        [Header("Server Configuration")]
        [SerializeField] private string serverUrl = "http://localhost:3001";
        [SerializeField] private string defaultRoomId = "ROOM-1";
        [SerializeField] private string playerNickname = "NguoiChoi_1";

        public SocketIOUnity Socket { get; private set; }
        public bool IsConnected => Socket != null && Socket.Connected;

        public event Action OnConnected;
        public event Action OnDisconnected;
        public event Action<RoomSnapshotData> OnRoomSnapshotReceived;
        public event Action<string> OnPhaseChanged;
        public event Action<GunActionData> OnGunActionReceived;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            ConnectToServer();
        }

        public void ConnectToServer()
        {
            try
            {
                var uri = new Uri(serverUrl);
                var options = new SocketIOOptions
                {
                    Transport = SocketIOClient.Transport.TransportProtocol.WebSocket,
                    Reconnection = true,
                    ReconnectionAttempts = 5,
                    ReconnectionDelay = 2000
                };

                Socket = new SocketIOUnity(uri, options);
                Socket.JsonSerializer = new NewtonsoftJsonSerializer();

                Socket.OnConnected += (sender, e) =>
                {
                    Debug.Log("<color=green>[SocketIO] Kết nối thành công tới Node.js Server!</color>");
                    UnityMainThreadDispatcher.Instance().Enqueue(() =>
                    {
                        OnConnected?.Invoke();
                        JoinRoom(defaultRoomId, playerNickname);
                    });
                };

                Socket.OnDisconnected += (sender, e) =>
                {
                    Debug.LogWarning("[SocketIO] Đã ngắt kết nối khỏi server: " + e);
                    UnityMainThreadDispatcher.Instance().Enqueue(() => OnDisconnected?.Invoke());
                };

                // Nhận toàn bộ trạng thái phòng đấu (Room Snapshot)
                Socket.On("room:snapshot", response =>
                {
                    var snapshot = response.GetValue<RoomSnapshotData>();
                    UnityMainThreadDispatcher.Instance().Enqueue(() =>
                    {
                        OnRoomSnapshotReceived?.Invoke(snapshot);
                    });
                });

                // Nhận thông báo đổi giai đoạn (Ngày, Bỏ phiếu, Bắn súng, Đêm)
                Socket.On("game:phase_change", response =>
                {
                    var phase = response.GetValue<string>();
                    UnityMainThreadDispatcher.Instance().Enqueue(() =>
                    {
                        OnPhaseChanged?.Invoke(phase);
                    });
                });

                // Nhận hiệu ứng rút súng / nổ súng từ người chơi khác
                Socket.On("game:gun_action", response =>
                {
                    var gunData = response.GetValue<GunActionData>();
                    UnityMainThreadDispatcher.Instance().Enqueue(() =>
                    {
                        OnGunActionReceived?.Invoke(gunData);
                    });
                });

                Socket.Connect();
            }
            catch (Exception ex)
            {
                Debug.LogError("[SocketIO] Lỗi kết nối: " + ex.Message);
            }
        }

        public void JoinRoom(string roomId, string nickname)
        {
            if (!IsConnected) return;

            var payload = new
            {
                roomId = roomId,
                nickname = nickname
            };

            Socket.Emit("room:join", payload);
            Debug.Log($"[SocketIO] Đã gửi yêu cầu vào phòng: {roomId} với tên: {nickname}");
        }

        public void SendPlayCard(string cardId)
        {
            if (!IsConnected) return;
            Socket.Emit("game:play_card", new { cardId = cardId });
        }

        public void SendAimAtPlayer(string targetPlayerId)
        {
            if (!IsConnected) return;
            Socket.Emit("game:aim_player", new { targetId = targetPlayerId });
        }

        public void SendPullTrigger(string targetPlayerId)
        {
            if (!IsConnected) return;
            Socket.Emit("game:pull_trigger", new { targetId = targetPlayerId });
        }

        private void OnDestroy()
        {
            if (Socket != null)
            {
                Socket.Disconnect();
                Socket.Dispose();
            }
        }
    }

    [System.Serializable]
    public class RoomSnapshotData
    {
        public string roomId;
        public string phase;
        public int timeRemaining;
        public List<PlayerData> players;
        public string accusedPlayerId;
        public int russianRouletteChamber;
    }

    [System.Serializable]
    public class PlayerData
    {
        public string id;
        public int seatIndex; // Vị trí ghế 0-7 quanh bàn
        public string nickname;
        public string role;
        public bool isDead;
        public int votes;
    }

    [System.Serializable]
    public class GunActionData
    {
        public string shooterId;
        public string targetId;
        public bool isLethal; // Có đạn trong buồng nổ hay không
    }
}
