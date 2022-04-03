import styles from '../../../DaoDetail/components/ProposalDetail/index.module.less'
import { Button } from 'antd'
import ProposalContent from '../../../../components/Proposal/ProposalContent'
import ProposalVoteDetail from '../../../../components/Proposal/ProposalVoteDetail'
// import CastVote from '../../../../components/Proposal/CastVote'
import CancelProposalUndo from '../../../../components/Proposal/ProposalUndoClaim/CancelProposalUndo'
import OtherUserDetail from '../../../../components/Proposal/OtherUserDetail'
// import ExecutableContent from '../../../../components/Proposal/ExecutableContent'
// import ExecutableVoteResult from '../../../../components/Proposal/ExecutableVoteResult'
import Vote from '../../../../components/Proposal/Vote'
import { Grid } from '@mui/material'
import { ProposalInfoProp, useVoteResults, useVotingOptionsById } from 'hooks/useVoting'
// import { ProposalType } from 'hooks/useCreateCommunityProposalCallback'
import { useCrossVoteCallback } from 'hooks/useVoteCallback'
import TransactionPendingModal from 'components/Modal/TransactionModals/TransactionPendingModal'
import useModal from 'hooks/useModal'
import TransactionSubmittedModal from 'components/Modal/TransactionModals/TransactiontionSubmittedModal'
import MessageBox from 'components/Modal/TransactionModals/MessageBox'
import { useCallback, useMemo } from 'react'
import { ExternalDaoInfoProps } from 'hooks/useDAOInfo'
import { TokenAmount } from 'constants/token'
import { useActiveWeb3React } from 'hooks'
import JSBI from 'jsbi'
// import { useResolveVotingResultCallback } from 'hooks/useResolveVotingResultCallback'
import { useExecuteProposalCallback } from 'hooks/useExecuteProposalCallback'
import TimelineStatus from 'pages/DaoDetail/components/ProposalDetail/TimelineStatus'
import { useVotingSignData } from 'hooks/useBackedCrossServer'

export default function Index({
  detail,
  onBack,
  daoInfo
}: {
  detail: ProposalInfoProp
  onBack: () => void
  daoInfo: ExternalDaoInfoProps
}) {
  const voteCallback = useCrossVoteCallback(daoInfo.votingAddress)
  const votInfo = useVotingSignData(daoInfo.token?.chainId, daoInfo.daoAddress, Number(detail.id))
  // const balanceOfAt = useCrossBalanceOfAt(daoInfo.token?.chainId, daoInfo.daoAddress, detail.id)
  const myDaoBalanceAt = useMemo(() => {
    if (!votInfo?.balance || !daoInfo.token) return undefined
    return new TokenAmount(daoInfo.token, votInfo.balance)
  }, [votInfo?.balance, daoInfo.token])
  const { account } = useActiveWeb3React()

  const currentProVoteInfo = useMemo(() => {
    if (!daoInfo.token) return undefined
    return {
      minimumVote: new TokenAmount(daoInfo.token, detail.minimumVote),
      minimumValidVotes: new TokenAmount(daoInfo.token, detail.minimumValidVotes),
      minimumCreateProposal: new TokenAmount(daoInfo.token, detail.minimumCreateProposal)
    }
  }, [daoInfo.token, detail.minimumCreateProposal, detail.minimumValidVotes, detail.minimumVote])

  const votingOptions = useVotingOptionsById(daoInfo.votingAddress, detail.id)
  const votingOptionsStatus = useMemo(() => {
    let total = '0'
    const list = votingOptions.map(item => {
      const _amount = daoInfo.token ? new TokenAmount(daoInfo.token, item.amount) : undefined
      total = JSBI.add(JSBI.BigInt(total), JSBI.BigInt(item.amount)).toString()
      return {
        name: item.name,
        per: 0,
        votes: _amount
      }
    })
    return {
      list,
      total
    }
  }, [daoInfo.token, votingOptions])
  const votingOptionsList = useMemo(() => {
    const _amount = daoInfo.token ? new TokenAmount(daoInfo.token, votingOptionsStatus.total) : undefined
    return votingOptionsStatus.list.map(item => {
      return {
        name: item.name,
        per: _amount && item.votes && _amount.greaterThan('0') ? Number(item.votes.divide(_amount).toFixed(3)) : 0,
        votes: item.votes
      }
    })
  }, [daoInfo.token, votingOptionsStatus.list, votingOptionsStatus.total])

  const isCreator = useMemo(() => {
    return account === detail.creator
  }, [account, detail.creator])

  const { hideModal, showModal } = useModal()

  const onVoteCallback = useCallback(
    (index: number) => {
      if (!votInfo) return
      showModal(<TransactionPendingModal />)
      voteCallback(
        { id: detail.id, index },
        votInfo.userAddress,
        votInfo.balance,
        votInfo.chainId,
        votInfo.votingAddress,
        votInfo.nonce,
        votInfo.sign
      )
        .then(() => {
          hideModal()
          showModal(<TransactionSubmittedModal />)
        })
        .catch(err => {
          hideModal()
          showModal(
            <MessageBox type="error">{err.error && err.error.message ? err.error.message : err?.message}</MessageBox>
          )
          console.error(err)
        })
    },
    [detail.id, hideModal, showModal, votInfo, voteCallback]
  )

  // const resolveVotingResultCallback = useResolveVotingResultCallback(daoInfo.votingAddress)
  const executeProposalCallback = useExecuteProposalCallback(daoInfo.votingAddress)

  const onExecuteProposalCallback = useCallback(() => {
    showModal(<TransactionPendingModal />)
    executeProposalCallback(detail.id)
      .then(() => {
        hideModal()
        showModal(<TransactionSubmittedModal />)
      })
      .catch(err => {
        hideModal()
        showModal(
          <MessageBox type="error">{err.error && err.error.message ? err.error.message : err?.message}</MessageBox>
        )
        console.error(err)
      })
  }, [detail.id, hideModal, executeProposalCallback, showModal])

  const voteResults = useVoteResults(daoInfo.votingAddress, detail.id)

  return (
    <div className={styles['proposal-detail-container']}>
      <Button className={styles['btn-back']} onClick={onBack}>
        Back
      </Button>

      <Grid container spacing={24}>
        <Grid item lg={8} xs={12} className={styles['left-part']}>
          <>
            <ProposalContent detail={detail} />
            <ProposalVoteDetail
              id={detail.id}
              votingAddress={daoInfo.votingAddress}
              list={votingOptionsList}
              minimumValidVotes={currentProVoteInfo?.minimumValidVotes}
            />
          </>
        </Grid>
        <Grid item lg={4} xs={12} className={styles['left-part']}>
          {/* {detail.status === ProposalStatusProp.Active && <CastVote />}
          {detail.status !== ProposalStatusProp.Active && <Vote />} */}
          <Vote
            detail={detail}
            voteResults={voteResults}
            onVote={onVoteCallback}
            list={votingOptionsList}
            minimumVote={currentProVoteInfo?.minimumVote}
            balanceAt={myDaoBalanceAt}
          />
          <TimelineStatus
            votingAddress={daoInfo?.votingAddress}
            detail={detail}
            onExecuteProposal={onExecuteProposalCallback}
          />
          {isCreator ? <CancelProposalUndo detail={detail} daoInfo={daoInfo} /> : <OtherUserDetail detail={detail} />}
        </Grid>
      </Grid>
    </div>
  )
}
