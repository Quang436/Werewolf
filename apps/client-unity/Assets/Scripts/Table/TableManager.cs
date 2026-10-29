using System.Collections.Generic;
using UnityEngine;
using Werewolf.Network;

namespace Werewolf.Table
{
    /// <summary>
    /// TableManager: Định vị 8 vị trí ghế ngồi quanh bàn cược tròn Liar's Bar.
    /// Lắng nghe event từ SocketNetworkManager để khởi tạo hoặc cập nhật trạng thái nhân vật 3D trên ghế.
    /// </summary>
    public class TableManager : MonoBehaviour
    {
        [Header("Table Configuration")]
        [SerializeField] private Transform[] seatTransforms; // 8 vị trí ghế quanh bàn
        [SerializeField] private GameObject mobsterPrefab;    // Prefab nhân vật 3D có Animator
        [SerializeField] private Transform cardDropZone;      // Tâm mặt bàn nỉ xanh để đặt bài

        [Header("3D Playing Card Prefab")]
        [SerializeField] private GameObject playingCard3DPrefab;

        private readonly Dictionary<string, MobsterCharacter> activeMobsters = new Dictionary<string, MobsterCharacter>();

        private void Start()
        {
            if (SocketNetworkManager.Instance != null)
            {
                SocketNetworkManager.Instance.OnRoomSnapshotReceived += HandleRoomSnapshot;
                SocketNetworkManager.Instance.OnGunActionReceived += HandleGunAction;
            }
        }

        private void OnDestroy()
        {
            if (SocketNetworkManager.Instance != null)
            {
                SocketNetworkManager.Instance.OnRoomSnapshotReceived -= HandleRoomSnapshot;
                SocketNetworkManager.Instance.OnGunActionReceived -= HandleGunAction;
            }
        }

        private void HandleRoomSnapshot(RoomSnapshotData snapshot)
        {
            if (snapshot?.players == null) return;

            foreach (var player in snapshot.players)
            {
                if (!activeMobsters.ContainsKey(player.id))
                {
                    SpawnMobsterAtSeat(player);
                }

                // Cập nhật trạng thái
                var mobster = activeMobsters[player.id];
                mobster.SetVotes(player.votes);
                mobster.SetAccused(player.id == snapshot.accusedPlayerId);

                if (player.isDead)
                {
                    mobster.TakeShot(true);
                }
            }
        }

        private void SpawnMobsterAtSeat(PlayerData player)
        {
            int seatIndex = Mathf.Clamp(player.seatIndex, 0, seatTransforms.Length - 1);
            Transform seat = seatTransforms[seatIndex];

            // Ghế số 0 thường là vị trí người chơi nhìn từ góc nhìn thứ nhất (FPS Camera)
            GameObject characterObj = Instantiate(mobsterPrefab, seat.position, seat.rotation, seat);
            var mobster = characterObj.GetComponent<MobsterCharacter>();

            mobster.SetupPlayer(player.id, player.nickname, player.role, seatIndex);
            activeMobsters[player.id] = mobster;
        }

        private void HandleGunAction(GunActionData gunData)
        {
            if (activeMobsters.TryGetValue(gunData.targetId, out var target))
            {
                target.TakeShot(gunData.isLethal);
            }
        }

        public void SpawnPlayedCardOnTable(string cardName)
        {
            if (playingCard3DPrefab == null || cardDropZone == null) return;

            // Đặt bài ngẫu nhiên nhẹ trên mặt bàn nỉ xanh
            Vector3 randomOffset = new Vector3(Random.Range(-0.35f, 0.35f), 0.01f, Random.Range(-0.25f, 0.25f));
            Quaternion randomRot = Quaternion.Euler(0f, Random.Range(-30f, 30f), 0f);

            Instantiate(playingCard3DPrefab, cardDropZone.position + randomOffset, randomRot, cardDropZone);
        }
    }
}
