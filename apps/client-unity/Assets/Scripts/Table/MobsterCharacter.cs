using UnityEngine;
using TMPro;

namespace Werewolf.Table
{
    /// <summary>
    /// MobsterCharacter: Đại diện cho 1 nhân vật 3D ngồi tại bàn cược Liar's Bar.
    /// Điều khiển Animator chuyển động: Thở (Sitting Idle), Bị tố cáo (Argue), Giơ súng ngắm (Aim), và Gục ngã (Death/Ragdoll).
    /// </summary>
    public class MobsterCharacter : MonoBehaviour
    {
        [Header("Character Identity")]
        public string PlayerId;
        public string Nickname;
        public int SeatIndex;

        [Header("Animator Components")]
        [SerializeField] private Animator animator;
        [SerializeField] private Rigidbody[] ragdollRigidbodies;

        [Header("World Space Nameplate UI")]
        [SerializeField] private TextMeshPro nameText;
        [SerializeField] private TextMeshPro roleText;
        [SerializeField] private GameObject voteBadge;
        [SerializeField] private TextMeshPro voteCountText;
        [SerializeField] private GameObject accusedIndicator;

        [Header("Weapon Attachment")]
        [SerializeField] private GameObject revolverProp;

        private bool isDead = false;

        private void Awake()
        {
            if (animator == null) animator = GetComponentInChildren<Animator>();
            EnableRagdoll(false);
        }

        public void SetupPlayer(string id, string nick, string role, int seat)
        {
            PlayerId = id;
            Nickname = nick;
            SeatIndex = seat;

            if (nameText != null) nameText.text = nick;
            if (roleText != null) roleText.text = role;
        }

        public void SetAccused(bool accused)
        {
            if (isDead) return;
            if (accusedIndicator != null) accusedIndicator.SetActive(accused);
            if (animator != null) animator.SetBool("IsAccused", accused);
        }

        public void SetVotes(int votes)
        {
            if (voteBadge != null)
            {
                voteBadge.SetActive(votes > 0);
                if (voteCountText != null) voteCountText.text = votes.ToString();
            }
        }

        public void PlayAimAnimation(bool aiming)
        {
            if (isDead) return;
            if (revolverProp != null) revolverProp.SetActive(aiming);
            if (animator != null) animator.SetBool("IsAiming", aiming);
        }

        public void TakeShot(bool isLethal)
        {
            if (isDead) return;

            if (isLethal)
            {
                isDead = true;
                if (animator != null) animator.enabled = false;
                EnableRagdoll(true);
                if (accusedIndicator != null) accusedIndicator.SetActive(false);
                if (nameText != null) nameText.color = Color.gray;
                Debug.Log($"[Mobster] {Nickname} đã bị bắn hạ!");
            }
            else
            {
                // Tiếng click khô và giật mình thoát chết
                if (animator != null) animator.SetTrigger("Flinch");
            }
        }

        private void EnableRagdoll(bool enable)
        {
            if (ragdollRigidbodies == null || ragdollRigidbodies.Length == 0)
                ragdollRigidbodies = GetComponentsInChildren<Rigidbody>();

            foreach (var rb in ragdollRigidbodies)
            {
                rb.isKinematic = !enable;
            }
        }
    }
}
