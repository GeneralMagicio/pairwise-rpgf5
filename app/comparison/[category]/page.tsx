'use client';

import React, { useEffect, useState } from 'react';
import { redirect, useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { useAuth } from '@/app/utils/wallet/AuthProvider';
import { JWTPayload } from '@/app/utils/wallet/types';
import { AutoScrollAction, ProjectCard } from '../card/ProjectCard';
import ConflictButton from '../card/CoIButton';
import Header from '../card/Header';
import { Rating } from '../card/Rating';
import UndoButton from '../card/UndoButton';
import VoteButton from '../card/VoteButton';
import Modals from '@/app/utils/wallet/Modals';
import {
  getPairwisePairsForProject,
  useGetPairwisePairs,
} from '../utils/data-fetching/pair';
import { convertCategoryNameToId } from '../utils/helpers';
import {
  useUpdateProjectUndo,
  useUpdateProjectVote,
} from '../utils/data-fetching/vote';
import { getBiggerNumber, usePrevious } from '@/app/utils/methods';
import { useMarkCoi } from '../utils/data-fetching/coi';
import Modal from '@/app/utils/Modal';
import { IProject } from '../utils/types';
import FinishBallot from '../ballot/modals/FinishBallotModal';
import BallotSuccessModal from '../ballot/modals/BallotSuccessModal';
import BallotLoading from '../ballot/modals/BallotLoading';
import { getBallot } from '../ballot/useGetBallot';
import { uploadBallot } from '@/app/utils/wallet/agora-login';
import BallotError from '../ballot/modals/BallotError';
import { mockProject1, mockProject2 } from '../card/mockData';
import IntroView from './IntroView';
import Spinner from '../../components/Spinner';
import LowRateModal from '../card/modals/LowRateModal';

const convertCategoryToLabel = (category: JWTPayload['category']) => {
  const labels = {
    ETHEREUM_CORE_CONTRIBUTIONS: 'Ethereum Core Contributors',
    OP_STACK_RESEARCH_AND_DEVELOPMENT: 'OP Stack R&D',
    OP_STACK_TOOLING: 'OP Stack Tooling',
  };
  return labels[category] || 'OP Stack';
};

export default function Home() {
  const { category } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { checkLoginFlow } = useAuth();
  const { address, chainId } = useAccount();

  const [rating1, setRating1] = useState<number>(3);
  const [rating2, setRating2] = useState<number>(3);
  const [project1, setProject1] = useState<IProject>();
  const [project2, setProject2] = useState<IProject>();
  const [coiLoading1, setCoiLoading1] = useState(false);
  const [coiLoading2, setCoiLoading2] = useState(false);
  const [bypassPrevProgress, setBypassPrevProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastAction, setLastAction] = useState<AutoScrollAction>();

  const [showFinishBallot, setShowFinishBallot] = useState(false);
  const [showSuccessBallot, setShowSuccessBallot] = useState(false);
  const [ballotLoading, setBallotLoading] = useState(false);
  const [ballotError, setBallotError] = useState(false);
  const [showLowRateModal, setShowLowRateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  const [sectionExpanded1, setSectionExpanded1] = useState({
    repos: true,
    pricing: true,
    grants: true,
    impact: true,
    testimonials: true,
  });
  const [sectionExpanded2, setSectionExpanded2] = useState({
    repos: true,
    pricing: true,
    grants: true,
    impact: true,
    testimonials: true,
  });

  const [temp, setTemp] = useState(0);
  const [coi1, setCoi1] = useState(false);
  const [coi2, setCoi2] = useState(false);
  const [isInitialVisit, setIsInitialVisit] = useState(true);

  const cid = convertCategoryNameToId(category as JWTPayload['category']);
  const { data, isLoading } = useGetPairwisePairs(cid);
  const prevProgress = usePrevious(progress);

  const { mutateAsync: markProjectCoI } = useMarkCoi();
  const { mutateAsync: vote } = useUpdateProjectVote({ categoryId: cid });
  const { mutateAsync: undo } = useUpdateProjectUndo({
    categoryId: cid,
    onSuccess: () => {
      // if this temp state is omitted
      // then when you CoI one project and
      // then you call "undo", the app breaks
      // we probably need to combine "/pairs" and "/pairs-for-project"
      setTemp(temp + 1);
      setBypassPrevProgress(true);
    },
  });

  useEffect(() => {
    checkLoginFlow();
  }, [checkLoginFlow]);

  useEffect(() => {
    if (bypassPrevProgress && data) {
      setProgress(data.progress);
      setBypassPrevProgress(false);
    } else {
      setProgress(getBiggerNumber(prevProgress, data?.progress));
    }
  }, [data]);

  useEffect(() => {
    if (!data || !data.pairs?.length) return;
    console.log(data);
    setRating1(data.pairs[0][0].rating || 3);
    setRating2(data.pairs[0][1].rating || 3);
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (data.pairs.length === 0) {
      setShowFinishBallot(true);
      if (!project1 || !project2) {
        setProject1(mockProject1);
        setProject2(mockProject2);
      }
      return;
    }
    setProject1(data.pairs[0][0]);
    setProject2(data.pairs[0][1]);
  }, [data, temp]);

  useEffect(() => {
    const checkFirstTimeVisit = () => {
      if (address && chainId) {
        const hasVisitedKey = `has_visited_${chainId}_${address}`;
        const storageElement = localStorage.getItem(hasVisitedKey);

        if (storageElement) setIsInitialVisit(true);

        const hasVisited = storageElement === 'true';
        setIsInitialVisit(!hasVisited);
      }
    };

    const checkVotedPairs = () => {
      if (data && !!data.votedPairs) {
        setIsInitialVisit(false);
      } else {
        checkFirstTimeVisit();
      }
    };

    checkVotedPairs();
  }, [address, chainId, data?.votedPairs]);

  const dispatchAction =
    (initiator: AutoScrollAction['initiator']) =>
    (
      section: AutoScrollAction['section'],
      action: AutoScrollAction['action']
    ) => {
      setLastAction({ section, initiator, action });
    };

  const confirmCoI1 = async (id1: number, id2: number) => {
    await markProjectCoI({ data: { pid: id1 } });
    setCoi1(false);
    setCoiLoading1(true);
    try {
      const pair = await getPairwisePairsForProject(cid, id2);
      setProject1(pair.pairs[0].find((project) => project.id !== id2)!);
    } catch (e) {
      queryClient.refetchQueries({
        queryKey: ['pairwise-pairs', cid],
      });
    }
    setCoiLoading1(false);
  };

  const cancelCoI1 = () => {
    setCoi1(false);
  };

  const showCoI1 = () => {
    setCoi1(true);
  };

  const confirmCoI2 = async (id1: number, id2: number) => {
    await markProjectCoI({ data: { pid: id2 } });
    setCoi2(false);
    setCoiLoading2(true);
    try {
      const pair = await getPairwisePairsForProject(cid, id1);
      setProject2(pair.pairs[0].find((project) => project.id !== id1)!);
      setCoi2(false);
    } catch (e) {
      queryClient.refetchQueries({
        queryKey: ['pairwise-pairs', cid],
      });
    }
    setCoiLoading2(false);
  };

  const cancelCoI2 = () => {
    setCoi2(false);
  };

  const showCoI2 = () => {
    setCoi2(true);
  };
  const setUserAsVisited = () => {
    if (address && chainId) {
      const hasVisitedKey = `has_visited_${chainId}_${address}`;
      localStorage.setItem(hasVisitedKey, 'true');
    }
    setIsInitialVisit(false);
  };

  const handleUnlockBallot = async () => {
    if (!address) return;
    setShowFinishBallot(false);
    setBallotLoading(true);
    setBallotError(false);
    try {
      const ballot = await getBallot(cid);
      await uploadBallot(ballot, address);
      setShowSuccessBallot(true);
    } catch (e) {
      setBallotError(true);
    } finally {
      setBallotLoading(false);
    }
  };

  const checkLowRatedProjectSelected = (chosenId: number): boolean => {
    const isLowRatedProjectSelected = (
      selectedId: number,
      ratingA: number | null | undefined,
      ratingB: number | null | undefined
    ) =>
      chosenId === selectedId && (!ratingA || (ratingB && ratingA < ratingB));

    if (
      isLowRatedProjectSelected(project1!.id, rating1, rating2) ||
      isLowRatedProjectSelected(project2!.id, rating2, rating1)
    ) {
      setSelectedProjectId(chosenId);
      setShowLowRateModal(true);
      return true;
    }

    return false;
  };

  const handleVote = async (chosenId: number) => {
    await vote({
      data: {
        project1Id: project1!.id,
        project2Id: project2!.id,
        project1Stars: rating1,
        project2Stars: rating2,
        pickedId: chosenId,
      },
    });
  };

  const handleUndo = async () => {
    setCoi1(false);
    setCoi2(false);
    await undo();
  };

  if (isLoading) return <Spinner />;

  if (!address || !chainId) return redirect('/landing');

  if (!project1 || !project2 || !data) return <div>No data</div>;

  return (
    <div>
      <Modals />
      <Modal
        isOpen={
          showFinishBallot ||
          showSuccessBallot ||
          ballotLoading ||
          ballotError ||
          showLowRateModal
        }
        onClose={() => {}}
      >
        {showFinishBallot && (
          <FinishBallot
            category={convertCategoryToLabel(
              category as JWTPayload['category']
            )}
            projectCount={35}
            onUnlock={handleUnlockBallot}
          />
        )}
        {showSuccessBallot && (
          <BallotSuccessModal
            onClick={() => {
              router.push('https://develop-op-voting.up.railway.app/ballot');
            }}
          />
        )}
        {ballotLoading && <BallotLoading />}
        {ballotError && <BallotError onClick={handleUnlockBallot} />}
        {showLowRateModal && (
          <LowRateModal
            proceedWithSelection={async () => {
              await handleVote(selectedProjectId!);
              setShowLowRateModal(false);
            }}
            cancelSelection={() => setShowLowRateModal(false)}
          />
        )}
      </Modal>
      <Header
        progress={progress * 100}
        category={convertCategoryToLabel(category! as JWTPayload['category'])}
        question="Which project had the greatest impact on the OP Stack?"
        isFirstSelection={isInitialVisit}
      />

      {isInitialVisit ? (
        <IntroView setUserAsVisited={setUserAsVisited} />
      ) : (
        <div className="relative flex w-full items-center justify-between gap-8 px-8 py-2">
          <div className="relative w-[49%]">
            <ProjectCard
              key={project1.RPGF5Id}
              sectionExpanded={sectionExpanded1}
              setSectionExpanded={setSectionExpanded1}
              name="card1"
              action={lastAction}
              dispatchAction={dispatchAction('card1')}
              key1={project1.RPGF5Id}
              key2={project2.RPGF5Id}
              coiLoading={coiLoading1}
              coi={coi1}
              project={{ ...project1.metadata, ...project1 } as any}
              onCoICancel={cancelCoI1}
              onCoIConfirm={() => confirmCoI1(project1.id, project2.id)}
            />
          </div>
          <div className="relative w-[49%]">
            <ProjectCard
              key={project2.RPGF5Id}
              sectionExpanded={sectionExpanded2}
              setSectionExpanded={setSectionExpanded2}
              name="card2"
              action={lastAction}
              dispatchAction={dispatchAction('card2')}
              key1={project2.RPGF5Id}
              key2={project1.RPGF5Id}
              coiLoading={coiLoading2}
              coi={coi2}
              onCoICancel={cancelCoI2}
              onCoIConfirm={() => confirmCoI2(project1.id, project2.id)}
              project={{ ...project2.metadata, ...project2 } as any}
            />
          </div>
        </div>
      )}

      <footer className="sticky bottom-0 flex w-full items-center justify-around gap-4 bg-white py-8 shadow-inner">
        {!coi1 && !coiLoading1 && (
          <div className="flex flex-col items-center justify-center gap-4 lg:flex-row xl:gap-8">
            <Rating
              value={rating1 || 3}
              onChange={setRating1}
              disabled={isInitialVisit}
            />
            <VoteButton
              onClick={() =>
                !checkLowRatedProjectSelected(project1.id) &&
                handleVote(project1.id)
              }
              disabled={isInitialVisit}
            />
            <ConflictButton onClick={showCoI1} disabled={isInitialVisit} />
          </div>
        )}
        <div className="absolute z-[1]">
          <UndoButton disabled={isInitialVisit} onClick={handleUndo} />
        </div>
        {!coi2 && !coiLoading2 && (
          <div className="flex flex-col items-center justify-center gap-4 lg:flex-row xl:gap-8">
            <Rating
              value={rating2 || 3}
              onChange={setRating2}
              disabled={isInitialVisit}
            />
            <VoteButton
              onClick={() =>
                !checkLowRatedProjectSelected(project2.id) &&
                handleVote(project2.id)
              }
              disabled={isInitialVisit}
            />
            <ConflictButton onClick={showCoI2} disabled={isInitialVisit} />
          </div>
        )}
      </footer>
    </div>
  );
}
